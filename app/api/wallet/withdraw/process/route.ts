/**
 * POST /api/wallet/withdraw/process - Process pending withdrawal transfer lifecycle
 */
import { NextRequest } from 'next/server';
import { Prisma, TransactionStatus, TransactionType } from '@/prisma/generated/client';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { initiateTransfer, verifyTransfer } from '@/lib/services/payments';

function readTransferMetadata(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
}

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/wallet/withdraw/process', async () => {
        const user = await getCurrentUser();
        const cronSecret = process.env.WITHDRAW_PROCESS_SECRET;
        const fromCron = Boolean(cronSecret) && req.headers.get('x-withdraw-process-secret') === cronSecret;

        if (!fromCron) {
            if (!user) return apiError('Unauthorized', 401);
            if (user.role !== UserRole.ADMIN) return apiError('Forbidden', 403);

            const rl = await rateLimitByUser(user.userId);
            if (!rl.success) return getRateLimitResponse(rl);
        }

        const body = await req.json().catch(() => ({}));
        const reference = typeof body.reference === 'string' ? body.reference.trim() : '';
        const action = typeof body.action === 'string' ? body.action.trim().toLowerCase() : 'auto';

        if (!reference) return apiError('reference is required', 400);
        if (!['auto', 'complete', 'fail'].includes(action)) {
            return apiError("action must be one of 'auto', 'complete', or 'fail'", 400);
        }

        const withdrawal = await prisma.transaction.findFirst({
            where: {
                reference,
                type: TransactionType.WITHDRAWAL,
            },
            select: {
                id: true,
                walletId: true,
                amount: true,
                status: true,
                reference: true,
                metadata: true,
            },
        });

        if (!withdrawal) return apiError('Withdrawal transaction not found', 404);

        if (withdrawal.status !== TransactionStatus.PENDING) {
            return apiSuccess({
                idempotent: true,
                message: 'Withdrawal has already been processed.',
                status: withdrawal.status,
                reference: withdrawal.reference,
            });
        }

        const metadata = readTransferMetadata(withdrawal.metadata);
        const bankName = typeof metadata.bankName === 'string' ? metadata.bankName : '';
        const accountName = typeof metadata.accountName === 'string' ? metadata.accountName : '';
        const accountNumber = typeof metadata.accountNumber === 'string' ? metadata.accountNumber : '';

        if (action === 'fail') {
            const failed = await prisma.transaction.update({
                where: { id: withdrawal.id },
                data: {
                    status: TransactionStatus.FAILED,
                    metadata: {
                        ...metadata,
                        transferStage: 'FAILED',
                        failedAt: new Date().toISOString(),
                        failedBy: user?.userId || 'system',
                    },
                },
            });

            return apiSuccess({
                message: 'Withdrawal marked as failed.',
                transaction: failed,
            });
        }

        const completeTransfer = async (providerReference?: string) => {
            const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                const wallet = await tx.wallet.findUnique({ where: { id: withdrawal.walletId } });
                if (!wallet) throw new Error('WALLET_NOT_FOUND');
                if (wallet.balance < withdrawal.amount) throw new Error('INSUFFICIENT_SETTLEMENT_BALANCE');

                const balanceBefore = wallet.balance;
                const balanceAfter = wallet.balance - withdrawal.amount;

                const updatedWallet = await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: balanceAfter },
                });

                const updatedTx = await tx.transaction.update({
                    where: { id: withdrawal.id },
                    data: {
                        status: TransactionStatus.COMPLETED,
                        balanceBefore,
                        balanceAfter,
                        description: 'Withdrawal transferred successfully',
                        metadata: {
                            ...metadata,
                            transferStage: 'COMPLETED',
                            completedAt: new Date().toISOString(),
                            completedBy: user?.userId || 'system',
                            providerReference: providerReference || metadata.providerReference || null,
                        },
                    },
                });

                return { wallet: updatedWallet, transaction: updatedTx };
            });

            return result;
        };

        if (action === 'complete') {
            const completed = await completeTransfer();
            return apiSuccess({
                message: 'Withdrawal transfer completed.',
                ...completed,
            });
        }

        if (!bankName || !accountName || !accountNumber) {
            return apiError('Withdrawal metadata is missing bank transfer details', 409);
        }

        const transfer = await initiateTransfer({
            gateway: 'PAYSTACK',
            amount: withdrawal.amount,
            bankName,
            accountName,
            accountNumber,
            reference: `WDR-TF-${withdrawal.reference}`,
            metadata: {
                walletId: withdrawal.walletId,
                withdrawalReference: withdrawal.reference,
            },
        });

        const verified = await verifyTransfer({
            gateway: transfer.gateway,
            providerReference: transfer.providerReference,
        });

        if (verified.status === 'SUCCESS') {
            const completed = await completeTransfer(transfer.providerReference);
            return apiSuccess({
                message: 'Auto transfer succeeded and withdrawal completed.',
                transfer,
                verification: verified,
                ...completed,
            });
        }

        if (verified.status === 'FAILED') {
            const failed = await prisma.transaction.update({
                where: { id: withdrawal.id },
                data: {
                    status: TransactionStatus.FAILED,
                    metadata: {
                        ...metadata,
                        transferStage: 'FAILED',
                        providerReference: transfer.providerReference,
                        failedAt: new Date().toISOString(),
                        failedBy: user?.userId || 'system-auto',
                    },
                },
            });

            return apiSuccess({
                message: 'Auto transfer failed. Withdrawal marked as failed.',
                transfer,
                verification: verified,
                transaction: failed,
            });
        }

        const pending = await prisma.transaction.update({
            where: { id: withdrawal.id },
            data: {
                metadata: {
                    ...metadata,
                    transferStage: 'PROCESSING',
                    providerReference: transfer.providerReference,
                    updatedAt: new Date().toISOString(),
                },
            },
        });

        return apiSuccess({
            message: 'Auto transfer is pending provider confirmation.',
            transfer,
            verification: verified,
            transaction: pending,
        });
    });
}
