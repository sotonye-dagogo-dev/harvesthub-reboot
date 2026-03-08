import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { UserRole } from "@/lib/constants";

// GET /api/cart - Get current user's cart
export async function GET(_request: NextRequest) {
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

        if (user.role !== UserRole.BUYER) {
            return NextResponse.json(
                { error: "Only buyers have carts" },
                { status: 403 }
            );
        }

        const buyer = db.buyers.findByUserId(user.id);
        if (!buyer) {
            return NextResponse.json({ error: "Buyer profile not found" }, { status: 404 });
        }

        // Get or create cart
        let cart = db.carts.findByBuyerId(buyer.id);
        if (!cart) {
            cart = db.carts.create(buyer.id);
        }

        // Enrich cart items with product details
        const enrichedItems = cart.items.map((item) => {
            const product = db.products.findById(item.productId);
            return { ...item, product };
        });

        return NextResponse.json({
            success: true,
            cart: { ...cart, items: enrichedItems },
        });
    } catch (error) {
        console.error("Get cart error:", error);
        return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
    }
}
