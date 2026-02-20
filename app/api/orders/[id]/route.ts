import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { OrderStatus, UserRole } from "@/lib/constants";

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

// GET /api/orders/[id] - Get single order
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const order = db.orders.findById(id);
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Access control: buyers can only see their own orders, vendors their own
        if (user.role === UserRole.BUYER) {
            const buyer = db.buyers.findByUserId(user.id);
            if (!buyer || order.buyerId !== buyer.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } else if (user.role === UserRole.VENDOR) {
            const vendor = db.vendors.findByUserId(user.id);
            if (!vendor || order.vendorId !== vendor.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const vendor = db.vendors.findById(order.vendorId);
        const buyer = db.buyers.findById(order.buyerId);
        const buyerUser = buyer ? db.users.findById(buyer.userId) : undefined;

        return NextResponse.json({
            success: true,
            order: { ...order, vendor, buyerUser },
        });
    } catch (error) {
        console.error("Get order error:", error);
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}

// PUT /api/orders/[id] - Update order status (vendor/admin)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (user.role === UserRole.BUYER) {
            return NextResponse.json(
                { error: "Buyers cannot update order status" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const order = db.orders.findById(id);
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Vendors can only update their own orders
        if (user.role === UserRole.VENDOR) {
            const vendor = db.vendors.findByUserId(user.id);
            if (!vendor || order.vendorId !== vendor.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const body = await request.json();
        const { status, notes } = body;

        if (!status) {
            return NextResponse.json({ error: "status is required" }, { status: 400 });
        }

        // Validate status transition
        const validStatuses = Object.values(OrderStatus);
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const updatedOrder = db.orders.updateStatus(id, status, user.id);

        if (notes && updatedOrder) {
            // Add note to last status history entry
            const lastEntry =
                updatedOrder.statusHistory[updatedOrder.statusHistory.length - 1];
            if (lastEntry) {
                lastEntry.notes = notes;
            }
        }

        return NextResponse.json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error("Update order error:", error);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}

// DELETE /api/orders/[id] - Delete order (admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: "Only admins can delete orders" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const order = db.orders.findById(id);
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        db.orders.delete(id);
        return NextResponse.json({ success: true, message: "Order deleted" });
    } catch (error) {
        console.error("Delete order error:", error);
        return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
    }
}
