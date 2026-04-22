/**
 * POST /api/wallet/deposit — Instant deposit (card/USSD payment confirmed)
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheInvalidate } from '@/lib/cache/redis';
import { userWalletKey } from '@/lib/cache/keys';
import { Prisma, TransactionType, TransactionStatus } from '../../../../prisma/generated/client';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { verifyPayment, type SupportedPaymentGateway } from '@/lib/services/payments';
import { dispatchNotification } from '@/lib/services/notifications';

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/wallet/deposit', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const {
            amount,
            description,
            paymentReference,
            paymentGateway,
            paymentVerificationReference,
        } = body;

        if (typeof amount !== 'number' || amount < 100) {
            return apiError('Minimum deposit is ₦100', 400);
        }

        if (!paymentReference || typeof paymentReference !== 'string') {
            return apiError('paymentReference is required', 400);
        }

        const gateway = String(paymentGateway || '').toUpperCase() as SupportedPaymentGateway;
        if (!['PAYSTACK', 'FLUTTERWAVE'].includes(gateway)) {
            return apiError('Unsupported or missing paymentGateway', 400);
        }

        const verification = await verifyPayment({
            gateway,
            reference: paymentVerificationReference || paymentReference,
        });

        if (verification.status === 'GATEWAY_UNAVAILABLE') {
            return apiError('Payment gateway is unavailable for verification', 503, {
                verification,
            });
        }

        if (verification.status !== 'SUCCESS') {
            return apiError('Payment verification is not successful', 400, {
                verification,
            });
        }

        const verifiedCurrency = verification.currency.trim().toUpperCase();
        if (verifiedCurrency !== 'NGN') {
            return apiError(`Payment currency mismatch. Expected NGN but received ${verifiedCurrency}.`, 400, {
                code: 'PAYMENT_CURRENCY_MISMATCH',
                verification,
            });
        }

        const expectedAmountSubunit = Math.round(amount * 100);
        const verifiedAmountSubunit = Math.round(verification.amount * 100);
        if (verifiedAmountSubunit !== expectedAmountSubunit) {
            return apiError('Payment amount does not match deposit request.', 400, {
                code: 'PAYMENT_AMOUNT_MISMATCH',
                expectedAmount: amount,
                verifiedAmount: verification.amount,
                verification,
            });
        }

        const wallet = await prisma.wallet.findUnique({ where: { userId: user.userId } });
        if (!wallet) return apiError('Wallet not found', 404);
        if (!wallet.isActive) return apiError('Wallet is disabled', 403);

        const reference = paymentReference;

        const existingTransaction = await prisma.transaction.findUnique({
            where: { reference },
            select: {
                id: true,
                walletId: true,
                type: true,
                amount: true,
                status: true,
                reference: true,
                description: true,
                balanceBefore: true,
                balanceAfter: true,
                metadata: true,
                orderId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (existingTransaction) {
            if (existingTransaction.walletId !== wallet.id) {
                return apiError('Payment reference already exists for another wallet.', 409, {
                    code: 'PAYMENT_REFERENCE_CONFLICT',
                    reference,
                });
            }

            if (existingTransaction.type !== TransactionType.DEPOSIT) {
                return apiError('Payment reference already exists for a different transaction type.', 409, {
                    code: 'PAYMENT_REFERENCE_TYPE_CONFLICT',
                    reference,
                    transactionType: existingTransaction.type,
                });
            }

            if (existingTransaction.status === TransactionStatus.COMPLETED) {
                const refreshedWallet = await prisma.wallet.findUnique({ where: { id: wallet.id } });
                if (!refreshedWallet) return apiError('Wallet not found', 404);

                await cacheInvalidate(userWalletKey(user.userId));

                return apiSuccess({
                    wallet: refreshedWallet,
                    transaction: existingTransaction,
                    verification,
                    idempotentReplay: true,
                    message: 'Deposit already processed for this payment reference.',
                });
            }

            return apiError('Payment reference is already being processed.', 409, {
                code: 'PAYMENT_REFERENCE_IN_PROGRESS',
                reference,
                transactionStatus: existingTransaction.status,
            });
        }

        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const updated = await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: amount } },
            });

            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: TransactionType.DEPOSIT,
                    amount,
                    balanceBefore: wallet.balance,
                    balanceAfter: updated.balance,
                    status: TransactionStatus.COMPLETED,
                    reference,
                    description: description || 'Wallet deposit',
                    metadata: {
                        gateway,
                        verificationStatus: verification.status,
                        verificationReference: paymentVerificationReference || paymentReference,
                    },
                },
            });

            return { wallet: updated, transaction };
        });

        await cacheInvalidate(userWalletKey(user.userId));

        await dispatchNotification({
            userId: user.userId,
            type: 'PAYMENT_SUCCESS',
            title: 'Wallet Deposit Successful',
            message: `Your wallet has been credited with NGN ${amount.toLocaleString('en-NG')}.`,
            link: '/wallet',
            emailSubject: 'Wallet deposit confirmed',
            metadata: {
                amount,
                reference,
                gateway,
            } as Prisma.InputJsonValue,
        });

        return apiSuccess({
            ...result,
            verification,
            message: 'Wallet deposit confirmed and balance updated.',
        });
    });
}
