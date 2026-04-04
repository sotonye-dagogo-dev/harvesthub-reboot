/**
 * POST /api/wallet/withdraw — Request withdrawal (vendors only)
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheInvalidate } from '@/lib/cache/redis';
import { userWalletKey } from '@/lib/cache/keys';
import { Prisma, TransactionType, TransactionStatus } from '../../../../prisma/generated/client';
import { UserRole } from '@/lib/constants';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/wallet/withdraw', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        if (user.role !== UserRole.VENDOR) return apiError('Vendors only', 403);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { amount, bankName, accountNumber, accountName } = body;

        if (typeof amount !== 'number' || amount < 1000) {
            return apiError('Minimum withdrawal is ₦1,000', 400);
        }
        if (!bankName || !accountNumber || !accountName) {
            return apiError('Bank details are required (bankName, accountNumber, accountName)', 400);
        }

        const wallet = await prisma.wallet.findUnique({ where: { userId: user.userId } });
        if (!wallet) return apiError('Wallet not found', 404);
        if (!wallet.isActive) return apiError('Wallet is disabled', 403);
        if (wallet.balance < amount) {
            return apiError('Insufficient balance', 400);
        }

        const reference = `WDR-${Date.now()}`;

        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const updated = await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: amount } },
            });

            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: TransactionType.WITHDRAWAL,
                    amount,
                    balanceBefore: wallet.balance,
                    balanceAfter: updated.balance,
                    status: TransactionStatus.PENDING,
                    reference,
                    description: 'Wallet withdrawal',
                    metadata: { bankName, accountNumber, accountName },
                },
            });

            return { wallet: updated, transaction };
        });

        await cacheInvalidate(userWalletKey(user.userId));

        return apiSuccess({
            message: 'Withdrawal request submitted. Funds will be transferred within 24 hours.',
            ...result,
        });
    });
}
