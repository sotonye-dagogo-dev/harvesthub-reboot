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

// GET /api/vendors/[id]/store-settings - Get vendor store settings
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
        const vendor = db.vendors.findById(id);

        if (!vendor) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        // Authorization: only own vendor or admin
        if (authUser.role === UserRole.VENDOR) {
            const ownVendor = db.vendors.findByUserId(authUser.id);
            if (!ownVendor || ownVendor.id !== id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } else if (authUser.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            storeSettings: vendor.storeSettings,
            storeName: vendor.storeName,
            storeDescription: vendor.storeDescription,
            storeLogo: vendor.storeLogo,
            storeBanner: vendor.storeBanner,
            category: vendor.category,
            campus: vendor.campus,
            position: vendor.position,
            whatsappNumber: vendor.whatsappNumber,
            isChurchAffiliated: vendor.isChurchAffiliated,
        });
    } catch (error) {
        console.error("Get store settings error:", error);
        return NextResponse.json({ error: "Failed to fetch store settings" }, { status: 500 });
    }
}

// PUT /api/vendors/[id]/store-settings - Update vendor store settings
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
        const vendor = db.vendors.findById(id);

        if (!vendor) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        // Authorization: only own vendor or admin
        if (authUser.role === UserRole.VENDOR) {
            const ownVendor = db.vendors.findByUserId(authUser.id);
            if (!ownVendor || ownVendor.id !== id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } else if (authUser.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();

        // Build update object
        const updateData: Record<string, unknown> = {};

        // Update store-level fields
        if (body.storeName !== undefined) updateData.storeName = body.storeName;
        if (body.storeDescription !== undefined) updateData.storeDescription = body.storeDescription;
        if (body.storeLogo !== undefined) updateData.storeLogo = body.storeLogo;
        if (body.storeBanner !== undefined) updateData.storeBanner = body.storeBanner;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.campus !== undefined) updateData.campus = body.campus;
        if (body.position !== undefined) updateData.position = body.position;
        if (body.whatsappNumber !== undefined) updateData.whatsappNumber = body.whatsappNumber;
        if (body.isChurchAffiliated !== undefined) updateData.isChurchAffiliated = body.isChurchAffiliated;

        // Update nested storeSettings
        if (body.storeSettings) {
            updateData.storeSettings = {
                ...vendor.storeSettings,
                ...body.storeSettings,
                policies: body.storeSettings.policies
                    ? { ...vendor.storeSettings.policies, ...body.storeSettings.policies }
                    : vendor.storeSettings.policies,
            };
        }

        // Non-admin vendors cannot update status or commission
        if (authUser.role !== UserRole.ADMIN) {
            delete updateData.status;
            delete updateData.commissionRate;
        }

        const updated = db.vendors.update(id, updateData);
        if (!updated) {
            return NextResponse.json({ error: "Failed to update store settings" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            storeSettings: updated.storeSettings,
            storeName: updated.storeName,
            storeDescription: updated.storeDescription,
            storeLogo: updated.storeLogo,
            storeBanner: updated.storeBanner,
            category: updated.category,
            campus: updated.campus,
            position: updated.position,
            whatsappNumber: updated.whatsappNumber,
            isChurchAffiliated: updated.isChurchAffiliated,
        });
    } catch (error) {
        console.error("Update store settings error:", error);
        return NextResponse.json({ error: "Failed to update store settings" }, { status: 500 });
    }
}
