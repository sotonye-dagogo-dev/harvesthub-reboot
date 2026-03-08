import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { UserRole } from "@/lib/constants";

async function getAuthUser(_request: NextRequest) {
    const { cookies } = await import("next/headers");
    const { verifyToken } = await import("@/lib/utils/auth");
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    if (!payload) return null;
    return db.users.findById(payload.userId);
}

// GET /api/users/[id]/profile - Get user profile with role-specific data
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Users can only see their own profile; admins can see all
        if (authUser.role !== UserRole.ADMIN && authUser.id !== id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const user = db.users.findById(id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Remove password from response
        const { password: _pw, ...safeUser } = user;

        // Enrich with role-specific data
        let roleData = {};
        if (user.role === UserRole.BUYER) {
            const buyer = db.buyers.findByUserId(id);
            const addresses = db.addresses.findAll(id);
            const wallet = db.wallets.findByUserId(id);
            roleData = {
                buyer,
                addresses,
                wallet: wallet ? { id: wallet.id, balance: wallet.balance } : null,
            };
        } else if (user.role === UserRole.VENDOR) {
            const vendor = db.vendors.findByUserId(id);
            const wallet = db.wallets.findByUserId(id);
            roleData = {
                vendor,
                wallet: wallet ? { id: wallet.id, balance: wallet.balance } : null,
            };
        }

        return NextResponse.json({
            success: true,
            profile: { ...safeUser, ...roleData },
        });
    } catch (error) {
        console.error("Get user profile error:", error);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

// PUT /api/users/[id]/profile - Update user profile
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        if (authUser.role !== UserRole.ADMIN && authUser.id !== id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const user = db.users.findById(id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await request.json();

        // Extract user-level vs role-specific fields
        const { buyer: buyerData, vendor: vendorData, ...userData } = body;

        // Non-admins cannot change roles, active status, or verification
        if (authUser.role !== UserRole.ADMIN) {
            delete userData.role;
            delete userData.isActive;
            delete userData.emailVerified;
        }

        // Never allow password change via this endpoint
        delete userData.password;
        delete userData.resetToken;
        delete userData.resetTokenExpiry;

        // Update base user data
        const updatedUser = db.users.update(id, userData);
        if (!updatedUser) {
            return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
        }

        // Update role-specific data
        if (buyerData && user.role === UserRole.BUYER) {
            const buyer = db.buyers.findByUserId(id);
            if (buyer) {
                db.buyers.update(buyer.id, buyerData);
            }
        }

        if (vendorData && user.role === UserRole.VENDOR) {
            const vendor = db.vendors.findByUserId(id);
            if (vendor) {
                db.vendors.update(vendor.id, vendorData);
            }
        }

        const { password: _pw, ...safeUser } = updatedUser;
        return NextResponse.json({ success: true, profile: safeUser });
    } catch (error) {
        console.error("Update user profile error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
