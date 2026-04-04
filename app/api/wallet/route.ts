/**
 * GET /api/wallet — Get current user's wallet
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheGet, cacheSet } from '@/lib/cache/redis';
import { userWalletKey } from '@/lib/cache/keys';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function GET(_req: NextRequest) {
    return withApiHandler('GET /api/wallet', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const cacheKey = userWalletKey(user.userId);
        const cached = await cacheGet(cacheKey);
        if (cached) return apiSuccess({ wallet: cached });

        const wallet = await prisma.wallet.findUnique({
            where: { userId: user.userId },
            include: {
                transactions: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!wallet) return apiError('Wallet not found', 404);

        await cacheSet(cacheKey, wallet, 120);
        return apiSuccess({ wallet });
    });
}
