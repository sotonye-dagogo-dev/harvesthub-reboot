/**
 * GET /api/wallet/balance — Get wallet balance only
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function GET(_req: NextRequest) {
    return withApiHandler('GET /api/wallet/balance', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const wallet = await prisma.wallet.findUnique({
            where: { userId: user.userId },
            select: { balance: true, currency: true },
        });
        if (!wallet) return apiError('Wallet not found', 404);

        return apiSuccess({ balance: wallet.balance, currency: wallet.currency });
    });
}
