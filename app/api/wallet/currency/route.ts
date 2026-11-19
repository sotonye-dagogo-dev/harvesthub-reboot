/**
 * GET /api/wallet/currency — the signed-in user's in-app currency balance + recent coin history.
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { coinsToNaira, getAppCurrencyConfig } from '@/lib/services/appCurrency';

export async function GET(req: NextRequest) {
    return withApiHandler('GET /api/wallet/currency', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const limitParam = Number(new URL(req.url).searchParams.get('limit') ?? 20);
        const limit = Number.isFinite(limitParam) ? Math.min(100, Math.max(1, Math.round(limitParam))) : 20;

        const [config, wallet] = await Promise.all([
            getAppCurrencyConfig(prisma),
            prisma.wallet.findUnique({
                where: { userId: user.userId },
                select: { id: true, balance: true, coinBalance: true, isActive: true },
            }),
        ]);

        const transactions = wallet
            ? await prisma.coinTransaction.findMany({
                  where: { walletId: wallet.id },
                  orderBy: { createdAt: 'desc' },
                  take: limit,
                  select: {
                      id: true,
                      type: true,
                      amount: true,
                      balanceBefore: true,
                      balanceAfter: true,
                      nairaValue: true,
                      rate: true,
                      reference: true,
                      description: true,
                      orderId: true,
                      createdAt: true,
                  },
              })
            : [];

        const coinBalance = wallet?.coinBalance ?? 0;
        return apiSuccess({
            config,
            coinBalance,
            coinBalanceNairaValue: coinsToNaira(coinBalance, config),
            nairaBalance: wallet?.balance ?? 0,
            walletActive: wallet?.isActive ?? false,
            transactions: transactions.map((entry) => ({
                ...entry,
                createdAt: entry.createdAt.toISOString(),
            })),
        });
    });
}
