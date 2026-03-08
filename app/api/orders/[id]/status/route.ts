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

// Valid status transitions per role
const VENDOR_ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING],
    [OrderStatus.PROCESSING]: [OrderStatus.READY],
    [OrderStatus.READY]: [OrderStatus.COMPLETED],
};

const ADMIN_ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.READY, OrderStatus.CANCELLED],
    [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    [OrderStatus.COMPLETED]: [OrderStatus.REFUNDED],
    [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
};

// PUT /api/orders/[id]/status - Update order status (vendor or admin only)
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

        // Vendor can only update their own orders
        if (user.role === UserRole.VENDOR) {
            const vendor = db.vendors.findByUserId(user.id);
            if (!vendor || order.vendorId !== vendor.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const body = await request.json();
        const { status, notes } = body as { status: OrderStatus; notes?: string };

        if (!status) {
            return NextResponse.json({ error: "status is required" }, { status: 400 });
        }

        // Validate transition
        const allowedTransitions =
            user.role === UserRole.ADMIN
                ? ADMIN_ALLOWED_TRANSITIONS
                : VENDOR_ALLOWED_TRANSITIONS;

        const validNext = allowedTransitions[order.status] ?? [];
        if (!validNext.includes(status)) {
            return NextResponse.json(
                {
                    error: `Cannot transition from ${order.status} to ${status}`,
                    allowedTransitions: validNext,
                },
                { status: 422 }
            );
        }

        const updatedOrder = db.orders.update(id, {
            status,
            statusHistory: [
                ...(order.statusHistory ?? []),
                {
                    status,
                    timestamp: new Date(),
                    updatedBy: user.id,
                    notes: notes ?? null,
                },
            ],
        });

        return NextResponse.json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error("Update order status error:", error);
        return NextResponse.json(
            { error: "Failed to update order status" },
            { status: 500 }
        );
    }
}
