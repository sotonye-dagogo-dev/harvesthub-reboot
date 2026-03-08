import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { UserRole, VendorStatus, PickupService } from "@/lib/constants";

// GET /api/vendors - Get vendor list (public)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") as VendorStatus | null;
        const campus = searchParams.get("campus") || undefined;
        const category = searchParams.get("category") || undefined;
        const search = searchParams.get("search") || undefined;
        const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

        const filters = {
            status: status || VendorStatus.APPROVED, // Public only sees approved vendors
            campus,
            category,
        };

        let vendors = db.vendors.findAll(filters);

        // Search by store name or description
        if (search) {
            const q = search.toLowerCase();
            vendors = vendors.filter(
                (v) =>
                    v.storeName.toLowerCase().includes(q) ||
                    v.storeDescription?.toLowerCase().includes(q)
            );
        }

        // Enrich with product counts
        const enriched = vendors.map((vendor) => {
            const products = db.products.findByVendor(vendor.id).filter((p) => p.isActive);
            return { ...vendor, productCount: products.length };
        });

        // Pagination
        const total = enriched.length;
        const totalPages = Math.ceil(total / limit);
        const data = enriched.slice((page - 1) * limit, page * limit);

        return NextResponse.json({
            success: true,
            vendors: data,
            pagination: { total, page, limit, totalPages },
        });
    } catch (error) {
        console.error("Get vendors error:", error);
        return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
    }
}

// POST /api/vendors - Create a new vendor (admin only, or during registration)
export async function POST(request: NextRequest) {
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

        // Only admins can create vendor profiles for other users
        // Vendors can only be created for users with VENDOR role
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.VENDOR) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const {
            userId,
            storeName,
            storeDescription,
            category,
            whatsappNumber,
            campus,
            position,
            isChurchAffiliated,
        } = body;

        // Determine target user
        const targetUserId = user.role === UserRole.ADMIN && userId ? userId : user.id;

        // Check if vendor already exists for this user
        const existingVendor = db.vendors.findByUserId(targetUserId);
        if (existingVendor) {
            return NextResponse.json(
                { error: "Vendor profile already exists for this user" },
                { status: 409 }
            );
        }

        if (!storeName || !category || !whatsappNumber || !campus) {
            return NextResponse.json(
                { error: "storeName, category, whatsappNumber, and campus are required" },
                { status: 400 }
            );
        }

        const newVendor = db.vendors.create({
            userId: targetUserId,
            storeName,
            storeDescription: storeDescription || null,
            category,
            whatsappNumber,
            campus,
            position: position || null,
            status: VendorStatus.PENDING,
            isChurchAffiliated: isChurchAffiliated ?? false,
            commissionRate: 0.05,
            storeLogo: null,
            storeBanner: null,
            businessVerification: null,
            storeSettings: {
                allowsPickup: true,
                allowsDelivery: false,
                pickupServices: [PickupService.SUNDAY_FIRST],
                deliveryZones: [],
                businessHours: null,
                policies: {
                    returnPolicy: null,
                    shippingPolicy: null,
                    privacyPolicy: null,
                },
            },
            analytics: {
                totalSales: 0,
                totalOrders: 0,
                totalProducts: 0,
                averageRating: 0,
                totalReviews: 0,
                conversionRate: 0,
                lastUpdated: new Date(),
            },
        });

        return NextResponse.json({ success: true, vendor: newVendor }, { status: 201 });
    } catch (error) {
        console.error("Create vendor error:", error);
        return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
    }
}
