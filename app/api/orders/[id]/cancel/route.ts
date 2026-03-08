import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { OrderStatus, PaymentStatus, UserRole } from "@/lib/constants";

// POST /api/orders/[id]/cancel - Cancel an order
export async function POST(
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
        const order = db.orders.findById(id);
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Access control
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

        // Only pending or confirmed orders can be cancelled
        const cancellableStatuses: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
        if (!cancellableStatuses.includes(order.status)) {
            return NextResponse.json(
                {
                    error: `Cannot cancel an order with status: ${order.status}. Only PENDING or CONFIRMED orders can be cancelled.`,
                },
                { status: 409 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const reason = body.reason ?? "Cancelled by user";

        // Cancel the order
        const updatedOrder = db.orders.updateStatus(id, OrderStatus.CANCELLED, user.id);
        if (!updatedOrder) {
            return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
        }

        // Add cancellation reason to status history
        const lastEntry = updatedOrder.statusHistory[updatedOrder.statusHistory.length - 1];
        if (lastEntry) {
            lastEntry.notes = reason;
        }

        // If order was paid via wallet, process refund
        if (order.paymentStatus === PaymentStatus.PAID && order.paymentMethod === "WALLET") {
            const buyer = db.buyers.findById(order.buyerId);
            if (buyer) {
                const wallet = db.wallets.findByUserId(buyer.userId);
                if (wallet) {
                    db.wallets.credit(wallet.id, order.total);
                    // Mark as refunded
                    db.orders.updatePaymentStatus(id, PaymentStatus.REFUNDED);
                    db.orders.updateStatus(id, OrderStatus.REFUNDED, "system");
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: "Order cancelled successfully",
            order: db.orders.findById(id),
        });
    } catch (error) {
        console.error("Cancel order error:", error);
        return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
    }
}
