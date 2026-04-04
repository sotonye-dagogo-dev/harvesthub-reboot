/**
 * PUT    /api/cart/items/[id] � Update cart item quantity
 * DELETE /api/cart/items/[id] � Remove item from cart
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

interface RouteContext { params: Promise<{ id: string }>; }

export async function PUT(req: NextRequest, context: RouteContext) {
    return withApiHandler('PUT /api/cart/items/[id]', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const cartItem = await prisma.cartItem.findUnique({
            where: { id },
            include: { cart: true, product: true },
        });
        if (!cartItem) return apiError('Cart item not found', 404);

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (!buyer || cartItem.cart.buyerId !== buyer.id) {
            return apiError('Forbidden', 403);
        }

        const { quantity } = await req.json();
        if (!quantity || quantity < 1) {
            return apiError('Quantity must be at least 1', 400);
        }
        if (quantity > cartItem.product.stock) {
            return apiError(`Only ${cartItem.product.stock} available`, 400);
        }

        const updated = await prisma.cartItem.update({
            where: { id },
            data: { quantity },
            include: { product: true },
        });

        return apiSuccess({ item: updated });
    });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    return withApiHandler('DELETE /api/cart/items/[id]', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const cartItem = await prisma.cartItem.findUnique({
            where: { id },
            include: { cart: true },
        });
        if (!cartItem) return apiError('Cart item not found', 404);

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (!buyer || cartItem.cart.buyerId !== buyer.id) {
            return apiError('Forbidden', 403);
        }

        await prisma.cartItem.delete({ where: { id } });
        return apiSuccess({ message: 'Item removed from cart' });
    });
}
