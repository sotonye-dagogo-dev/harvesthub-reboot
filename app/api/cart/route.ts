/**
 * GET /api/cart — Get current buyer's cart
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

export async function GET(_req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.BUYER) return NextResponse.json({ error: 'Buyers only' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

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

        return NextResponse.json({ success: true, cart });
    } catch (error) {
        console.error('GET /api/cart error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
