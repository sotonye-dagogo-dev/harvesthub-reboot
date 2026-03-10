/**
 * DELETE /api/cart/clear — Clear all cart items
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

export async function DELETE(_req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.BUYER) return NextResponse.json({ error: 'Buyers only' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const buyer = await prisma.buyer.findUnique({ where: { userId: user.userId } });
        if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

        const cart = await prisma.cart.findUnique({ where: { buyerId: buyer.id } });
        if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });

        await prisma.$transaction([
            prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
            prisma.cart.update({ where: { id: cart.id }, data: { subtotal: 0 } }),
        ]);

        return NextResponse.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        console.error('DELETE /api/cart/clear error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
