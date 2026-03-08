import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { UserRole } from "@/lib/constants";
import type { Order } from "@/lib/types";

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

// GET /api/vendors/[id]/analytics - Get vendor analytics
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

        // Refresh analytics before returning
        db.vendors.updateAnalytics(id);

        // Reload vendor to get updated analytics
        const updatedVendor = db.vendors.findById(id);
        if (!updatedVendor) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        // Get additional analytics data
        const products = db.products.findByVendor(id);
        const activeProducts = products.filter((p) => p.isActive);
        const outOfStockProducts = products.filter((p) => p.stock === 0);

        const ordersResult = db.orders.findAll({ vendorId: id });
        const ordersList = Array.isArray(ordersResult) ? ordersResult : ordersResult.data;
        const recentOrders = ordersList
            .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);

        return NextResponse.json({
            success: true,
            analytics: {
                ...updatedVendor.analytics,
                activeProducts: activeProducts.length,
                outOfStockProducts: outOfStockProducts.length,
                totalListedProducts: products.length,
                recentOrders: recentOrders.map((order: Order) => ({
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    total: order.total,
                    createdAt: order.createdAt,
                })),
            },
        });
    } catch (error) {
        console.error("Get vendor analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
