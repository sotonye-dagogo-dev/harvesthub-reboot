import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { UserRole, VendorStatus } from "@/lib/constants";

// GET /api/vendors/[id] - Get vendor by ID (public for approved vendors)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const vendor = db.vendors.findById(id);

        if (!vendor) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        // Non-admin users can only see approved vendors
        // (Admins/vendors can see their own regardless of status)
        let isAdmin = false;
        try {
            const { cookies } = await import("next/headers");
            const { verifyToken } = await import("@/lib/utils/auth");
            const cookieStore = await cookies();
            const token = cookieStore.get("accessToken")?.value;
            if (token) {
                const payload = await verifyToken(token);
                if (payload) {
                    const user = db.users.findById(payload.userId);
                    isAdmin = user?.role === UserRole.ADMIN;
                    // Vendor can see own profile
                    if (user?.role === UserRole.VENDOR) {
                        const ownVendor = db.vendors.findByUserId(user.id);
                        isAdmin = ownVendor?.id === id;
                    }
                }
            }
        } catch {
            // Continue as unauthenticated
        }

        if (!isAdmin && vendor.status !== VendorStatus.APPROVED) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        const products = db.products.findByVendor(id).filter((p) => p.isActive);
        const reviews = products.flatMap((p) => db.reviews.findAll({ productId: p.id }));
        const avgRating =
            reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;

        return NextResponse.json({
            success: true,
            vendor: {
                ...vendor,
                productCount: products.length,
                reviewCount: reviews.length,
                averageRating: Math.round(avgRating * 10) / 10,
            },
        });
    } catch (error) {
        console.error("Get vendor error:", error);
        return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 });
    }
}

// PUT /api/vendors/[id] - Update vendor profile (own vendor or admin)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { cookies } = await import("next/headers");
        const { verifyToken } = await import("@/lib/utils/auth");

        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const user = db.users.findById(payload.userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { id } = await params;
        const vendor = db.vendors.findById(id);

        if (!vendor) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        // Authorization: only own vendor or admin
        if (user.role === UserRole.VENDOR) {
            const ownVendor = db.vendors.findByUserId(user.id);
            if (!ownVendor || ownVendor.id !== id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } else if (user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();

        // Admins can update status; vendors cannot
        if (user.role !== UserRole.ADMIN) {
            delete body.status;
            delete body.commissionRate;
        }

        const updated = db.vendors.update(id, body);
        if (!updated) {
            return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
        }

        return NextResponse.json({ success: true, vendor: updated });
    } catch (error) {
        console.error("Update vendor error:", error);
        return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
    }
}
