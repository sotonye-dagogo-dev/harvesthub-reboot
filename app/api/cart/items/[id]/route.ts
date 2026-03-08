import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { UserRole } from "@/lib/constants";

async function getBuyerAndCart(_request: NextRequest) {
    const { cookies } = await import("next/headers");
    const { verifyToken } = await import("@/lib/utils/auth");
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    if (!payload) return null;
    const user = db.users.findById(payload.userId);
    if (!user || user.role !== UserRole.BUYER) return null;
    const buyer = db.buyers.findByUserId(user.id);
    if (!buyer) return null;
    const cart = db.carts.findByBuyerId(buyer.id);
    return cart ? { buyer, cart } : null;
}

// PUT /api/cart/items/[id] - Update cart item quantity
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const context = await getBuyerAndCart(request);
        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { cart } = context;
        const { id: itemId } = await params;

        // Verify item belongs to this cart
        const item = cart.items.find((i) => i.id === itemId);
        if (!item) {
            return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
        }

        const body = await request.json();
        const { quantity } = body;

        if (quantity === undefined || quantity === null) {
            return NextResponse.json({ error: "quantity is required" }, { status: 400 });
        }

        if (quantity < 0) {
            return NextResponse.json(
                { error: "quantity cannot be negative" },
                { status: 400 }
            );
        }

        // Validate stock if quantity > 0
        if (quantity > 0) {
            const product = db.products.findById(item.productId);
            if (product && product.stock < quantity) {
                return NextResponse.json(
                    { error: `Only ${product.stock} items available in stock` },
                    { status: 409 }
                );
            }
        }

        const updatedCart = db.carts.updateItemQuantity(cart.id, itemId, quantity);
        if (!updatedCart) {
            return NextResponse.json({ error: "Failed to update cart item" }, { status: 500 });
        }

        const enrichedItems = updatedCart.items.map((i) => ({
            ...i,
            product: db.products.findById(i.productId),
        }));

        return NextResponse.json({
            success: true,
            cart: { ...updatedCart, items: enrichedItems },
        });
    } catch (error) {
        console.error("Update cart item error:", error);
        return NextResponse.json({ error: "Failed to update cart item" }, { status: 500 });
    }
}

// DELETE /api/cart/items/[id] - Remove item from cart
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const context = await getBuyerAndCart(request);
        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { cart } = context;
        const { id: itemId } = await params;

        // Verify item belongs to this cart
        const item = cart.items.find((i) => i.id === itemId);
        if (!item) {
            return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
        }

        const updatedCart = db.carts.removeItem(cart.id, itemId);
        if (!updatedCart) {
            return NextResponse.json({ error: "Failed to remove cart item" }, { status: 500 });
        }

        const enrichedItems = updatedCart.items.map((i) => ({
            ...i,
            product: db.products.findById(i.productId),
        }));

        return NextResponse.json({
            success: true,
            cart: { ...updatedCart, items: enrichedItems },
        });
    } catch (error) {
        console.error("Remove cart item error:", error);
        return NextResponse.json({ error: "Failed to remove cart item" }, { status: 500 });
    }
}
