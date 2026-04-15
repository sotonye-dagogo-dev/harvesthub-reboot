/**
 * POST /api/wallet/withdraw — Request withdrawal (authenticated users)
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheInvalidate } from '@/lib/cache/redis';
import { userWalletKey } from '@/lib/cache/keys';
import { Prisma, TransactionType, TransactionStatus } from '../../../../prisma/generated/client';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { getCommerceLifecycleConfig } from '@/lib/services/commerceConfig';

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/wallet/withdraw', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

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

        const commerceConfig = await getCommerceLifecycleConfig(prisma);
        const settlementHoldWindowMs =
            commerceConfig.withdrawalSettlementHoldHours * 60 * 60 * 1000;

        const pendingSettlementWindowStart = new Date(
            Date.now() - settlementHoldWindowMs
        );
        const pendingSettlement = await prisma.transaction.findFirst({
            where: {
                walletId: wallet.id,
                type: TransactionType.PAYOUT,
                status: TransactionStatus.PENDING,
                createdAt: { gte: pendingSettlementWindowStart },
            },
            select: {
                reference: true,
                orderId: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        if (pendingSettlement) {
            return apiError(
                'Withdrawal is temporarily unavailable while a recent store settlement payout is pending release.',
                409,
                {
                    code: 'WITHDRAWAL_PENDING_SETTLEMENT',
                    payoutReference: pendingSettlement.reference,
                    orderId: pendingSettlement.orderId,
                    heldAt: pendingSettlement.createdAt.toISOString(),
                }
            );
        }

        const pendingWithdrawalsAggregate = await prisma.transaction.aggregate({
            where: {
                walletId: wallet.id,
                type: TransactionType.WITHDRAWAL,
                status: TransactionStatus.PENDING,
            },
            _sum: { amount: true },
        });

        const reservedAmount = pendingWithdrawalsAggregate._sum.amount ?? 0;
        const availableBalance = wallet.balance - reservedAmount;

        if (availableBalance < amount) {
            return apiError('Insufficient balance', 400);
        }

        const reference = `WDR-${Date.now()}`;

        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: TransactionType.WITHDRAWAL,
                    amount,
                    balanceBefore: wallet.balance,
                    balanceAfter: wallet.balance,
                    status: TransactionStatus.PENDING,
                    reference,
                    description: 'Wallet withdrawal request pending transfer processing',
                    metadata: {
                        bankName,
                        accountNumber,
                        accountName,
                        transferStage: 'REQUESTED',
                        requestedAt: new Date().toISOString(),
                    },
                },
            });

            return { wallet, transaction };
        });

        await cacheInvalidate(userWalletKey(user.userId));

        return apiSuccess({
            message:
                'Withdrawal request submitted. Transfer processing will update this transaction once provider status is confirmed.',
            ...result,
            availableBalance,
        });
    });
}
