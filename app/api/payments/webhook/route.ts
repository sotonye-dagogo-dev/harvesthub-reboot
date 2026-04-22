import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { env } from '@/lib/config/env';
import { prisma } from '@/lib/db/prisma';
import { cacheAcquireIdempotencyKey } from '@/lib/cache/redis';
import { verifyPayment } from '@/lib/services/payments';
import { Prisma, AdApplicationStatus, PaymentStatus, TransactionStatus } from '@/prisma/generated/client';

const WEBHOOK_IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24 * 3;
const LOCAL_IDEMPOTENCY_CACHE_LIMIT = 5_000;
const localWebhookReplayGuard = new Map<string, number>();

type PaystackWebhookPayload = {
    event?: unknown;
    data?: {
        id?: unknown;
        reference?: unknown;
        status?: unknown;
        amount?: unknown;
        currency?: unknown;
    };
};

type OrderWebhookAuditRow = {
    id: string;
    orderNumber: string;
    total: number;
    paymentStatus: PaymentStatus;
    statusHistory: Prisma.JsonValue;
};

function isSignatureValid(signature: string, rawBody: string, secretKey: string): boolean {
    const computed = createHmac('sha512', secretKey).update(rawBody).digest('hex');

    const providedBuffer = Buffer.from(signature, 'utf8');
    const computedBuffer = Buffer.from(computed, 'utf8');
    if (providedBuffer.length !== computedBuffer.length) return false;

    return timingSafeEqual(providedBuffer, computedBuffer);
}

function normalizeCurrency(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim().toUpperCase() : null;
}

function normalizeProviderEventId(value: unknown): string | null {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return null;
}

function toStatusHistoryArray(value: Prisma.JsonValue): Array<Record<string, unknown>> {
    if (!Array.isArray(value)) return [];
    return value
        .filter((entry) => typeof entry === 'object' && entry !== null && !Array.isArray(entry))
        .map((entry) => entry as Record<string, unknown>);
}

function acquireLocalReplayGuard(key: string, ttlSeconds: number): boolean {
    const now = Date.now();

    for (const [cachedKey, expiresAt] of localWebhookReplayGuard.entries()) {
        if (expiresAt <= now) {
            localWebhookReplayGuard.delete(cachedKey);
        }
    }

    if (localWebhookReplayGuard.has(key)) {
        return false;
    }

    if (localWebhookReplayGuard.size >= LOCAL_IDEMPOTENCY_CACHE_LIMIT) {
        const oldestKey = localWebhookReplayGuard.keys().next().value;
        if (oldestKey) {
            localWebhookReplayGuard.delete(oldestKey);
        }
    }

    localWebhookReplayGuard.set(key, now + ttlSeconds * 1000);
    return true;
}

async function appendOrderWebhookAudit(params: {
    reference: string;
    eventType: string;
    providerEventId: string | null;
    verificationStatus: string;
    verificationProviderStatus: string | null;
    payloadAmountSubunit: number | null;
    payloadCurrency: string | null;
}) {
    const { reference, eventType, providerEventId, verificationStatus, verificationProviderStatus, payloadAmountSubunit, payloadCurrency } = params;

    const matchedOrders = await prisma.order.findMany({
        where: {
            notes: {
                contains: reference,
            },
        },
        select: {
            id: true,
            orderNumber: true,
            total: true,
            paymentStatus: true,
            statusHistory: true,
        },
    });

    let updatedOrderCount = 0;

    for (const order of matchedOrders as OrderWebhookAuditRow[]) {
        const history = toStatusHistoryArray(order.statusHistory);
        const alreadyAudited = history.some((entry) => {
            const entryReference =
                typeof entry.paymentReference === 'string' ? entry.paymentReference : null;
            const entryWebhookEvent =
                typeof entry.webhookEvent === 'string' ? entry.webhookEvent : null;
            return entryReference === reference && entryWebhookEvent === eventType;
        });

        if (alreadyAudited) {
            continue;
        }

        const payloadMatchesOrder =
            payloadAmountSubunit === null
                ? true
                : Math.round(Number(order.total || 0) * 100) === payloadAmountSubunit;
        const payloadCurrencyMatches = payloadCurrency === null || payloadCurrency === 'NGN';

        history.push({
            status: 'PAYMENT_WEBHOOK_CONFIRMED',
            timestamp: new Date().toISOString(),
            note: `Webhook ${eventType} reconciled for payment reference ${reference}.`,
            paymentReference: reference,
            webhookEvent: eventType,
            providerEventId,
            verificationStatus,
            verificationProviderStatus,
        });

        const updateData: Prisma.OrderUpdateInput = {
            statusHistory: history as Prisma.InputJsonValue,
        };

        if (
            order.paymentStatus === PaymentStatus.PENDING &&
            payloadMatchesOrder &&
            payloadCurrencyMatches
        ) {
            updateData.paymentStatus = PaymentStatus.PAID;
        }

        await prisma.order.update({
            where: { id: order.id },
            data: updateData,
        });
        updatedOrderCount += 1;
    }

    return {
        matchedOrderCount: matchedOrders.length,
        updatedOrderCount,
    };
}

async function reconcileAdApplicationWebhook(params: {
    reference: string;
    payloadAmountSubunit: number | null;
    payloadCurrency: string | null;
}) {
    const { reference, payloadAmountSubunit, payloadCurrency } = params;
    const pendingMarker = `PAYSTACK_PENDING:${reference}`;

    if (!prisma.adApplication?.findMany) {
        return {
            matchedApplicationCount: 0,
            updatedApplicationCount: 0,
        };
    }

    const matchedApplications = await prisma.adApplication.findMany({
        where: {
            reviewComment: {
                contains: pendingMarker,
            },
        },
        select: {
            id: true,
            amountPaid: true,
            status: true,
            reviewComment: true,
        },
    });

    let updatedApplicationCount = 0;

    for (const application of matchedApplications) {
        const amountMatchesPayload =
            payloadAmountSubunit === null
                ? true
                : Math.round(Number(application.amountPaid || 0) * 100) === payloadAmountSubunit;
        const currencyMatchesPayload = payloadCurrency === null || payloadCurrency === 'NGN';

        if (
            application.status !== AdApplicationStatus.PENDING_APPROVAL &&
            amountMatchesPayload &&
            currencyMatchesPayload
        ) {
            await prisma.adApplication.update({
                where: { id: application.id },
                data: {
                    status: AdApplicationStatus.PENDING_APPROVAL,
                    reviewComment: `${application.reviewComment || pendingMarker} | webhook-confirmed ${new Date().toISOString()}`,
                },
            });
            updatedApplicationCount += 1;
        }
    }

    return {
        matchedApplicationCount: matchedApplications.length,
        updatedApplicationCount,
    };
}

async function reconcilePaystackChargeSuccess(params: {
    reference: string;
    eventType: string;
    providerEventId: string | null;
    payloadAmountSubunit: number | null;
    payloadCurrency: string | null;
}) {
    const { reference, eventType, providerEventId, payloadAmountSubunit, payloadCurrency } = params;

    const verification = await verifyPayment({
        gateway: 'PAYSTACK',
        reference,
    });

    const verifiedAmountSubunit = verification.status === 'SUCCESS' ? Math.round(verification.amount * 100) : null;
    const verifiedCurrency = normalizeCurrency(verification.currency);
    const amountMatchesPayload =
        payloadAmountSubunit === null || verifiedAmountSubunit === null
            ? null
            : payloadAmountSubunit === verifiedAmountSubunit;
    const currencyMatchesPayload =
        payloadCurrency === null || verifiedCurrency === null
            ? null
            : payloadCurrency === verifiedCurrency;

    const transaction = await prisma.transaction.findUnique({
        where: { reference },
        select: {
            id: true,
            walletId: true,
            type: true,
            amount: true,
            status: true,
            metadata: true,
        },
    });

    let transactionUpdated = false;
    let walletCredited = false;
    if (transaction) {
        const baseMetadata =
            transaction.metadata && typeof transaction.metadata === 'object' && !Array.isArray(transaction.metadata)
                ? (transaction.metadata as Record<string, unknown>)
                : {};

        const nextMetadata: Record<string, unknown> = {
            ...baseMetadata,
            webhookLastEventAt: new Date().toISOString(),
            webhookLastEventType: eventType,
            webhookLastProviderEventId: providerEventId,
            webhookReference: reference,
            webhookVerificationStatus: verification.status,
            webhookVerificationProviderStatus: verification.providerStatus || null,
            webhookAmountMatchesPayload: amountMatchesPayload,
            webhookCurrencyMatchesPayload: currencyMatchesPayload,
        };

        const updateData: Prisma.TransactionUpdateInput = {
            metadata: nextMetadata as Prisma.InputJsonValue,
        };

        const transactionAmountMatchesPayload =
            payloadAmountSubunit === null
                ? true
                : Math.round(Number(transaction.amount || 0) * 100) === payloadAmountSubunit;

        if (
            transaction.status === TransactionStatus.PENDING &&
            transaction.type === 'DEPOSIT' &&
            transactionAmountMatchesPayload &&
            (payloadCurrency === null || payloadCurrency === 'NGN')
        ) {
            await prisma.$transaction(async (tx) => {
                const wallet = await tx.wallet.findUnique({
                    where: { id: transaction.walletId },
                    select: { id: true, balance: true },
                });

                const nextBalance = wallet ? wallet.balance + transaction.amount : null;

                if (wallet) {
                    await tx.wallet.update({
                        where: { id: wallet.id },
                        data: {
                            balance: { increment: transaction.amount },
                        },
                    });
                    walletCredited = true;
                }

                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        ...updateData,
                        status: TransactionStatus.COMPLETED,
                        balanceBefore: wallet ? wallet.balance : undefined,
                        balanceAfter: nextBalance ?? undefined,
                    },
                });
            });
        } else {
            if (transaction.status === TransactionStatus.PENDING && verification.status === 'SUCCESS') {
                updateData.status = TransactionStatus.COMPLETED;
            }

            await prisma.transaction.update({
                where: { id: transaction.id },
                data: updateData,
            });
        }

        transactionUpdated = true;
    }

    const orderAudit = await appendOrderWebhookAudit({
        reference,
        eventType,
        providerEventId,
        verificationStatus: verification.status,
        verificationProviderStatus: verification.providerStatus || null,
        payloadAmountSubunit,
        payloadCurrency,
    });

    return {
        verification,
        amountMatchesPayload,
        currencyMatchesPayload,
        transactionMatched: Boolean(transaction),
        transactionUpdated,
        walletCredited,
        ...orderAudit,
    };
}

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/payments/webhook', async () => {
        const signature = req.headers.get('x-paystack-signature');
        const rawBody = await req.text();

        if (!env.paystackWebhooksEnabled) {
            return apiSuccess({
                acknowledged: true,
                webhooksEnabled: false,
                message: 'Paystack webhooks are disabled by feature flag.',
            });
        }

        const signingSecret = env.paystackWebhookSecret || env.paystackSecretKey;
        if (!signingSecret) {
            return apiError('Paystack webhook secret key is not configured for active mode', 503);
        }

        if (!signature) {
            return apiError('Missing x-paystack-signature header', 401);
        }

        if (!isSignatureValid(signature, rawBody, signingSecret)) {
            return apiError('Invalid Paystack webhook signature', 401);
        }

        let payload: PaystackWebhookPayload = {};
        try {
            payload = JSON.parse(rawBody || '{}') as PaystackWebhookPayload;
        } catch {
            return apiError('Invalid webhook payload', 400);
        }

        const eventType = typeof payload.event === 'string' ? payload.event : 'unknown';
        const reference =
            typeof payload.data?.reference === 'string' && payload.data.reference.trim().length > 0
                ? payload.data.reference.trim()
                : null;
        const providerEventId = normalizeProviderEventId(payload.data?.id);

        const idempotencyKey = `paystack-webhook:${eventType}:${providerEventId || reference || 'unknown'}`;
        const cacheAcquireResult = await cacheAcquireIdempotencyKey(
            idempotencyKey,
            WEBHOOK_IDEMPOTENCY_TTL_SECONDS
        );

        let idempotencyMode: 'redis' | 'local-memory' = 'redis';
        let acquired = cacheAcquireResult === 'acquired';

        if (cacheAcquireResult === 'unavailable') {
            idempotencyMode = 'local-memory';
            acquired = acquireLocalReplayGuard(idempotencyKey, WEBHOOK_IDEMPOTENCY_TTL_SECONDS);
        }

        if (!acquired) {
            return apiSuccess({
                acknowledged: true,
                duplicate: true,
                eventType,
                reference,
                providerEventId,
                idempotency: {
                    key: idempotencyKey,
                    mode: idempotencyMode,
                    acquired: false,
                },
                message: 'Duplicate webhook replay ignored.',
            });
        }

        if (eventType !== 'charge.success') {
            return apiSuccess({
                acknowledged: true,
                ignored: true,
                eventType,
                reference,
                providerEventId,
                idempotency: {
                    key: idempotencyKey,
                    mode: idempotencyMode,
                    acquired: true,
                },
                message: 'Webhook event acknowledged; no reconciliation action required for this event type.',
            });
        }

        if (!reference) {
            return apiError('Missing payment reference in charge.success payload', 400, {
                eventType,
                providerEventId,
            });
        }

        const payloadAmountSubunit =
            typeof payload.data?.amount === 'number' && Number.isFinite(payload.data.amount)
                ? Math.round(payload.data.amount)
                : null;
        const payloadCurrency = normalizeCurrency(payload.data?.currency);

        const reconciliation = await reconcilePaystackChargeSuccess({
            reference,
            eventType,
            providerEventId,
            payloadAmountSubunit,
            payloadCurrency,
        });

        const adApplicationAudit = await reconcileAdApplicationWebhook({
            reference,
            payloadAmountSubunit,
            payloadCurrency,
        });

        return apiSuccess({
            acknowledged: true,
            eventType,
            reference,
            providerEventId,
            paystackMode: env.paystackMode,
            idempotency: {
                key: idempotencyKey,
                mode: idempotencyMode,
                acquired: true,
            },
            reconciliation,
            adApplicationAudit,
            message: 'Webhook signature verified and reconciliation completed.',
        });
    });
}
