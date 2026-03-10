/**
 * PUT    /api/cart/items/[id] � Update cart item quantity
 * DELETE /api/cart/items/[id] � Remove item from cart
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';

interface RouteContext { params: Promise<{ id: string }>; }

export async function PUT(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const cartItem = await prisma.cartItem.findUnique({
            where: { id },
            include: { cart: true, product: true },
        });
        if (!cartItem) return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (!buyer || cartItem.cart.buyerId !== buyer.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { quantity } = await req.json();
        if (!quantity || quantity < 1) {
            return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 });
        }
        if (quantity > cartItem.product.stock) {
            return NextResponse.json({ error: `Only ${cartItem.product.stock} available` }, { status: 400 });
        }

        const updated = await prisma.cartItem.update({
            where: { id },
            data: { quantity },
            include: { product: true },
        });

        return NextResponse.json({ success: true, item: updated });
    } catch (error) {
        console.error('PUT /api/cart/items/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const cartItem = await prisma.cartItem.findUnique({
            where: { id },
            include: { cart: true },
        });
        if (!cartItem) return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (!buyer || cartItem.cart.buyerId !== buyer.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.cartItem.delete({ where: { id } });
        return NextResponse.json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
        console.error('DELETE /api/cart/items/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
