/**
 * GET /api/wallet — Get current user's wallet
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheGet, cacheSet } from '@/lib/cache/redis';
import { userWalletKey } from '@/lib/cache/keys';

export async function GET(_req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const cacheKey = userWalletKey(user.userId);
        const cached = await cacheGet(cacheKey);
        if (cached) return NextResponse.json({ success: true, wallet: cached });

        const wallet = await prisma.wallet.findUnique({
            where: { userId: user.userId },
            include: {
                transactions: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });

        await cacheSet(cacheKey, wallet, 120);
        return NextResponse.json({ success: true, wallet });
    } catch (error) {
        console.error('GET /api/wallet error:', error);
        return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
    }
}
