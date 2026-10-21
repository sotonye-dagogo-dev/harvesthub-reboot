/**
 * GET  /api/subscriptions — current user's subscription summary + purchase history.
 * POST /api/subscriptions — purchase / renew / upgrade a subscription package.
 *
 * Payment methods (Session 104 decision: CARD + WALLET only — no bank transfer):
 * - CARD:   Paystack inline popup on the client; the server verifies the
 *           reference (status + NGN + exact subunit amount) before activation.
 *           GATEWAY_UNAVAILABLE mirrors the wallet-deposit contract: the inline
 *           client callback is accepted as authoritative for Paystack and the
 *           activation is annotated `acceptedWithoutVerification` (webhook
 *           reconciliation can annotate later).
 * - WALLET: atomic balance debit + subscription creation in one transaction
 *           (ACID), with a PAYMENT ledger row for observability.
 *
 * Every purchase creates a NEW VendorSubscription row; the paid window extends
 * from max(now, current effective expiry) so early renewals never lose time.
 * Idempotency: unique `paymentReference` (SUB- prefix) — replays return the
 * existing subscription instead of double-charging.
 */
import { NextRequest } from 'next/server';
import { Prisma, TransactionStatus, TransactionType } from '@/prisma/generated/client';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { verifyPayment } from '@/lib/services/payments';
import { dispatchNotification } from '@/lib/services/notifications';
import { UserRole } from '@/lib/constants';
import {
    buildSubscriptionReference,
    getLatestSubscription,
    getPaymentModelsConfig,
    getSubscriptionSummary,
    isSubscriptionEffective,
    resolveSubscriptionWindow,
} from '@/lib/services/subscriptions';

const SUBSCRIPTION_PURCHASE_LIMIT = { limit: 20, window: 300 } as const;

function toNaira(amount: number): string {
    return `NGN ${amount.toLocaleString('en-NG')}`;
}

async function notifyActivated(userId: string, payload: {
    packageName: string;
    amount: number;
    expiresAt: string;
    reference: string;
    renewed: boolean;
}): Promise<void> {
    try {
        await dispatchNotification({
            userId,
            type: 'SUBSCRIPTION_ACTIVATED',
            title: payload.renewed ? 'Subscription Renewed' : 'Subscription Activated',
            message: `Your ${payload.packageName} subscription is active until ${new Date(payload.expiresAt).toDateString()}.`,
            link: '/operations/subscription',
            emailSubject: `Your ${payload.packageName} subscription is active`,
            metadata: {
                packageName: payload.packageName,
                amount: payload.amount,
                expiresAt: payload.expiresAt,
                reference: payload.reference,
            } as Prisma.InputJsonValue,
        });
    } catch (error) {
        console.error('[subscriptions] activation notification failed', error);
    }
}

export async function GET() {
    return withApiHandler('GET /api/subscriptions', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const [summary, history, wallet] = await Promise.all([
            getSubscriptionSummary(prisma, user.userId),
            prisma.vendorSubscription
                .findMany({
                    where: { userId: user.userId },
                    orderBy: { createdAt: 'desc' },
                    take: 25,
                    include: {
                        package: { select: { id: true, name: true, slug: true, durationDays: true } },
                    },
                })
                .catch(() => []),
            prisma.wallet.findUnique({
                where: { userId: user.userId },
                select: { balance: true, isActive: true },
            }),
        ]);

        return apiSuccess({
            summary,
            history,
            walletBalance: wallet?.balance ?? 0,
            walletActive: wallet?.isActive ?? false,
        });
    });
}

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/subscriptions', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        if (user.role === UserRole.ADMIN) {
            return apiError('Admin accounts do not require a vendor subscription.', 403, {
                code: 'ADMIN_NOT_ELIGIBLE',
            });
        }

        const rl = await rateLimitByUser(user.userId, SUBSCRIPTION_PURCHASE_LIMIT);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = (await req.json().catch(() => null)) as {
            packageId?: unknown;
            packageSlug?: unknown;
            paymentMethod?: unknown;
            paymentReference?: unknown;
            paymentVerificationReference?: unknown;
        } | null;
        if (!body) return apiError('Invalid JSON body', 400);

        const paymentMethod = String(body.paymentMethod || '').toUpperCase();
        if (paymentMethod !== 'CARD' && paymentMethod !== 'WALLET') {
            return apiError('paymentMethod must be CARD or WALLET', 400, {
                code: 'UNSUPPORTED_PAYMENT_METHOD',
            });
        }

        const config = await getPaymentModelsConfig(prisma);
        if (!config.subscriptionEnabled) {
            return apiError('Subscription packages are currently disabled.', 403, {
                code: 'SUBSCRIPTIONS_DISABLED',
            });
        }

        const packageId = typeof body.packageId === 'string' ? body.packageId.trim() : '';
        const packageSlug = typeof body.packageSlug === 'string' ? body.packageSlug.trim() : '';
        if (!packageId && !packageSlug) {
            return apiError('packageId or packageSlug is required', 400, { code: 'PACKAGE_REQUIRED' });
        }

        const pkg = await prisma.subscriptionPackage
            .findFirst({
                where: packageId
                    ? { id: packageId, isActive: true }
                    : { slug: packageSlug, isActive: true },
            })
            .catch(() => null);
        if (!pkg) {
            return apiError('Subscription package not found or no longer available.', 404, {
                code: 'PACKAGE_NOT_FOUND',
            });
        }

        const amount = Math.round(pkg.price * 100) / 100;
        const isFreePackage = amount <= 0;

        // Reference: client-generated for CARD (Paystack inline), server-generated for WALLET.
        let reference: string;
        if (paymentMethod === 'CARD') {
            if (typeof body.paymentReference !== 'string' || !body.paymentReference.trim()) {
                return apiError('paymentReference is required for card payments', 400);
            }
            reference = body.paymentReference.trim();
        } else if (typeof body.paymentReference === 'string' && body.paymentReference.trim()) {
            reference = body.paymentReference.trim();
        } else {
            reference = buildSubscriptionReference();
        }

        // Idempotent replay: the same reference can never purchase twice.
        const existing = await prisma.vendorSubscription
            .findFirst({
                where: { paymentReference: reference },
                include: { package: { select: { id: true, name: true, slug: true, durationDays: true } } },
            })
            .catch(() => null);
        if (existing) {
            return apiSuccess({
                subscription: existing,
                idempotentReplay: true,
                message: 'This payment reference was already used. No additional charge was made.',
            });
        }

        let cardVerification: Awaited<ReturnType<typeof verifyPayment>> | null = null;
        let acceptedWithoutVerification = false;

        if (paymentMethod === 'CARD' && !isFreePackage) {
            cardVerification = await verifyPayment({
                gateway: 'PAYSTACK',
                reference:
                    typeof body.paymentVerificationReference === 'string' &&
                    body.paymentVerificationReference.trim()
                        ? body.paymentVerificationReference.trim()
                        : reference,
            });

            if (cardVerification.status === 'GATEWAY_UNAVAILABLE') {
                // Same contract as wallet deposits: Paystack inline callback is
                // authoritative when provider verification is unreachable.
                acceptedWithoutVerification = true;
                console.warn(
                    '[subscriptions] Paystack verification unavailable; accepting inline response for reference',
                    reference
                );
            } else if (cardVerification.status !== 'SUCCESS') {
                return apiError('Payment verification is not successful.', 400, {
                    code: 'PAYMENT_NOT_CONFIRMED',
                    verification: cardVerification,
                });
            } else {
                const verifiedCurrency = cardVerification.currency.trim().toUpperCase();
                if (verifiedCurrency !== 'NGN') {
                    return apiError(`Payment currency mismatch. Expected NGN but received ${verifiedCurrency}.`, 400, {
                        code: 'PAYMENT_CURRENCY_MISMATCH',
                    });
                }
                const expectedSubunit = Math.round(amount * 100);
                const verifiedSubunit = Math.round(cardVerification.amount * 100);
                if (verifiedSubunit !== expectedSubunit) {
                    return apiError('Payment amount does not match the package price.', 400, {
                        code: 'PAYMENT_AMOUNT_MISMATCH',
                        expectedAmount: amount,
                        verifiedAmount: cardVerification.amount,
                    });
                }
            }
        }

        // Renewal/upgrade window extends from the current effective subscription.
        const latest = await getLatestSubscription(prisma, user.userId);
        const currentExpiry = latest && isSubscriptionEffective(latest) ? latest.expiresAt : null;
        const renewed = currentExpiry !== null;
        const window = resolveSubscriptionWindow(currentExpiry, pkg.durationDays);

        try {
            const subscription = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                let paidBalanceBefore: number | null = null;
                let paidBalanceAfter: number | null = null;

                if (paymentMethod === 'WALLET' && !isFreePackage) {
                    const wallet = await tx.wallet.findUnique({ where: { userId: user.userId } });
                    if (!wallet) {
                        throw Object.assign(new Error('Wallet not found for this account.'), {
                            __status: 404,
                            __code: 'WALLET_NOT_FOUND',
                        });
                    }
                    if (!wallet.isActive) {
                        throw Object.assign(new Error('Wallet is disabled.'), {
                            __status: 403,
                            __code: 'WALLET_DISABLED',
                        });
                    }
                    const pendingWithdrawals = await tx.transaction.aggregate({
                        where: { walletId: wallet.id, type: TransactionType.WITHDRAWAL, status: TransactionStatus.PENDING },
                        _sum: { amount: true },
                    });
                    const availableBalance =
                        Math.round((wallet.balance - (pendingWithdrawals._sum.amount ?? 0)) * 100) / 100;
                    if (availableBalance < amount) {
                        throw Object.assign(
                            new Error(
                                `Insufficient wallet balance. Available ${toNaira(availableBalance)}, required ${toNaira(amount)}.`
                            ),
                            { __status: 400, __code: 'INSUFFICIENT_WALLET_BALANCE' }
                        );
                    }

                    paidBalanceBefore = wallet.balance;
                    const updatedWallet = await tx.wallet.update({
                        where: { id: wallet.id },
                        data: { balance: { decrement: amount } },
                    });
                    paidBalanceAfter = updatedWallet.balance;
                }

                const created = await tx.vendorSubscription.create({
                    data: {
                        userId: user.userId,
                        packageId: pkg.id,
                        status: 'ACTIVE',
                        paymentMethod: (isFreePackage ? 'WALLET' : paymentMethod) as never,
                        paymentReference: reference,
                        amount,
                        startAt: window.startAt,
                        expiresAt: window.expiresAt,
                        metadata: {
                            renewed,
                            previousExpiresAt: currentExpiry ? currentExpiry.toISOString() : null,
                            ...(acceptedWithoutVerification ? { acceptedWithoutVerification: true } : {}),
                            ...(cardVerification ? { verificationStatus: cardVerification.status } : {}),
                            ...(isFreePackage ? { freeOfCharge: true } : {}),
                        },
                    },
                    include: {
                        package: { select: { id: true, name: true, slug: true, durationDays: true } },
                    },
                });

                // Ledger row (wallet debit for WALLET; audit record for CARD) so
                // admins can observe subscription payments alongside wallet activity.
                const walletRow = await tx.wallet.findUnique({
                    where: { userId: user.userId },
                    select: { id: true, balance: true },
                });
                if (walletRow) {
                    await tx.transaction.create({
                        data: {
                            walletId: walletRow.id,
                            type: TransactionType.PAYMENT,
                            amount,
                            balanceBefore: paidBalanceBefore ?? walletRow.balance,
                            balanceAfter: paidBalanceAfter ?? walletRow.balance,
                            status: TransactionStatus.COMPLETED,
                            reference,
                            description: `Subscription purchase — ${pkg.name}`,
                            metadata: {
                                subscriptionId: created.id,
                                packageId: pkg.id,
                                packageName: pkg.name,
                                paymentMethod: isFreePackage ? 'WALLET' : paymentMethod,
                                ...(acceptedWithoutVerification ? { acceptedWithoutVerification: true } : {}),
                            } as Prisma.InputJsonValue,
                        },
                    });
                }

                return created;
            });

            await notifyActivated(user.userId, {
                packageName: pkg.name,
                amount,
                expiresAt: subscription.expiresAt.toISOString(),
                reference,
                renewed,
            });

            return apiSuccess(
                {
                    subscription,
                    window: {
                        previousExpiresAt: currentExpiry ? currentExpiry.toISOString() : null,
                        startAt: subscription.startAt.toISOString(),
                        expiresAt: subscription.expiresAt.toISOString(),
                    },
                    ...(cardVerification ? { verification: cardVerification } : {}),
                    message: renewed
                        ? `Subscription extended — now active until ${subscription.expiresAt.toDateString()}.`
                        : `Subscription active until ${subscription.expiresAt.toDateString()}.`,
                },
                201
            );
        } catch (error) {
            // Unique-reference race: another request with the same reference won.
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                const raced = await prisma.vendorSubscription
                    .findFirst({
                        where: { paymentReference: reference },
                        include: { package: { select: { id: true, name: true, slug: true, durationDays: true } } },
                    })
                    .catch(() => null);
                if (raced) {
                    return apiSuccess({
                        subscription: raced,
                        idempotentReplay: true,
                        message: 'This payment reference was already used. No additional charge was made.',
                    });
                }
            }

            const status = (error as { __status?: number }).__status;
            const code = (error as { __code?: string }).__code;
            if (typeof status === 'number' && code) {
                return apiError((error as Error).message, status, { code });
            }
            throw error;
        }
    });
}
