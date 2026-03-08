import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { UserRole } from "@/lib/constants";

// DELETE /api/cart/clear - Clear all items from cart
export async function DELETE(_request: NextRequest) {
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
        if (!user || user.role !== UserRole.BUYER) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const buyer = db.buyers.findByUserId(user.id);
        if (!buyer) {
            return NextResponse.json({ error: "Buyer profile not found" }, { status: 404 });
        }

        const success = db.carts.clear(buyer.id);
        if (!success) {
            // Cart doesn't exist - create empty one and return success
            const cart = db.carts.create(buyer.id);
            return NextResponse.json({ success: true, cart });
        }

        const cart = db.carts.findByBuyerId(buyer.id);
        return NextResponse.json({
            success: true,
            message: "Cart cleared successfully",
            cart,
        });
    } catch (error) {
        console.error("Clear cart error:", error);
        return NextResponse.json({ error: "Failed to clear cart" }, { status: 500 });
    }
}
