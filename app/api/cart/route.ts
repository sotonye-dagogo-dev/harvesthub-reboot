/**
 * GET /api/cart — Get current buyer's cart
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function GET(_req: NextRequest) {
    return withApiHandler('GET /api/cart', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        if (user.role !== UserRole.BUYER) return apiError('Buyers only', 403);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (!buyer) return apiError('Buyer not found', 404);

        let cart = await prisma.cart.findUnique({
            where: { buyerId: buyer.id },
            include: {
                items: {
                    include: { product: { include: { vendor: { select: { id: true, storeName: true, storeLogo: true } } } } },
                    orderBy: { addedAt: 'desc' },
                },
            },
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { buyerId: buyer.id, subtotal: 0 },
                include: {
                    items: {
                        include: { product: { include: { vendor: { select: { id: true, storeName: true, storeLogo: true } } } } },
                        orderBy: { addedAt: 'desc' },
                    },
                },
            });
        }

        return apiSuccess({ cart });
    });
}
