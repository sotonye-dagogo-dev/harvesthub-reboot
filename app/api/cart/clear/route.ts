/**
 * DELETE /api/cart/clear — Clear all cart items
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function DELETE(_req: NextRequest) {
    return withApiHandler('DELETE /api/cart/clear', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        if (user.role !== UserRole.BUYER) return apiError('Buyers only', 403);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (!buyer) return apiError('Buyer not found', 404);

        const cart = await prisma.cart.findUnique({ where: { buyerId: buyer.id } });
        if (!cart) return apiError('Cart not found', 404);

        await prisma.$transaction([
            prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
            prisma.cart.update({ where: { id: cart.id }, data: { subtotal: 0 } }),
        ]);

        return apiSuccess({ message: 'Cart cleared' });
    });
}
