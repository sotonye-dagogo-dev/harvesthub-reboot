import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { UserRole } from "@/lib/constants";

async function getBuyerFromRequest(_request: NextRequest) {
    const { cookies } = await import("next/headers");
    const { verifyToken } = await import("@/lib/utils/auth");
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    if (!payload) return null;
    const user = db.users.findById(payload.userId);
    if (!user || user.role !== UserRole.BUYER) return null;
    return db.buyers.findByUserId(user.id);
}

// POST /api/cart/items - Add item to cart
export async function POST(request: NextRequest) {
    try {
        const buyer = await getBuyerFromRequest(request);
        if (!buyer) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { productId, quantity = 1, selectedVariants } = body;

        if (!productId) {
            return NextResponse.json({ error: "productId is required" }, { status: 400 });
        }

        if (quantity < 1) {
            return NextResponse.json(
                { error: "quantity must be at least 1" },
                { status: 400 }
            );
        }

        const product = db.products.findById(productId);
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        if (!product.isActive) {
            return NextResponse.json(
                { error: "Product is not available" },
                { status: 409 }
            );
        }

        if (product.stock < quantity) {
            return NextResponse.json(
                { error: `Only ${product.stock} items available in stock` },
                { status: 409 }
            );
        }

        const cart = db.carts.addItem(buyer.id, productId, quantity, selectedVariants);
        if (!cart) {
            return NextResponse.json({ error: "Failed to add item to cart" }, { status: 500 });
        }

        // Enrich items with product details
        const enrichedItems = cart.items.map((item) => {
            const prod = db.products.findById(item.productId);
            return { ...item, product: prod };
        });

        return NextResponse.json({
            success: true,
            cart: { ...cart, items: enrichedItems },
        });
    } catch (error) {
        console.error("Add to cart error:", error);
        return NextResponse.json({ error: "Failed to add item to cart" }, { status: 500 });
    }
}
