/**
 * POST /api/wallet/currency/convert — convert naira from the wallet into the in-app currency.
 * Body: { amount: number (naira), idempotencyKey?: string }
 * One-way by design: there is no endpoint to convert coins back to naira.
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { cacheInvalidate } from '@/lib/cache/redis';
import { userWalletKey } from '@/lib/cache/keys';
import {
    AppCurrencyError,
    appCurrencyErrorResponse,
    convertNairaToCoins,
    getAppCurrencyConfig,
} from '@/lib/services/appCurrency';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/wallet/currency/convert', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = (await req.json().catch(() => ({}))) as { amount?: unknown; idempotencyKey?: unknown };
        const amount = Number(body.amount);
        const idempotencyKey =
            typeof body.idempotencyKey === 'string' && IDEMPOTENCY_KEY_PATTERN.test(body.idempotencyKey)
                ? body.idempotencyKey
                : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
        const reference = `COIN-CONVERT-${user.userId}-${idempotencyKey}`;

        const config = await getAppCurrencyConfig(prisma);

        try {
            const result = await prisma.$transaction((tx) =>
                convertNairaToCoins(tx, { userId: user.userId, nairaAmount: amount, reference, config })
            );
            await cacheInvalidate(userWalletKey(user.userId));

            const wallet = await prisma.wallet.findUnique({
                where: { userId: user.userId },
                select: { balance: true, coinBalance: true },
            });

            return apiSuccess(
                {
                    replayed: result.replayed,
                    coinsCredited: result.coinTransaction.amount,
                    reference: result.coinTransaction.reference,
                    nairaBalance: wallet?.balance ?? 0,
                    coinBalance: wallet?.coinBalance ?? 0,
                    config,
                },
                result.replayed ? 200 : 201
            );
        } catch (error) {
            if (error instanceof AppCurrencyError) {
                const status = error.code === 'APP_CURRENCY_DISABLED' ? 403 : error.code === 'WALLET_NOT_AVAILABLE' ? 409 : 400;
                const payload = appCurrencyErrorResponse(error, config);
                return apiError(payload.error, status, { code: payload.code });
            }
            throw error;
        }
    });
}
