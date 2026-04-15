import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { env } from '@/lib/config/env';
import { prisma } from '@/lib/db/prisma';
import { cacheAcquireIdempotencyKey } from '@/lib/cache/redis';
import { verifyPayment } from '@/lib/services/payments';
import { Prisma, TransactionStatus } from '@/prisma/generated/client';

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
}) {
    const { reference, eventType, providerEventId, verificationStatus, verificationProviderStatus } = params;

    const matchedOrders = await prisma.order.findMany({
        where: {
            notes: {
                contains: reference,
            },
        },
        select: {
            id: true,
            orderNumber: true,
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

        await prisma.order.update({
            where: { id: order.id },
            data: { statusHistory: history as Prisma.InputJsonValue },
        });
        updatedOrderCount += 1;
    }

    return {
        matchedOrderCount: matchedOrders.length,
        updatedOrderCount,
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

    const verifiedAmountSubunit = Math.round(verification.amount * 100);
    const verifiedCurrency = normalizeCurrency(verification.currency);
    const amountMatchesPayload =
        payloadAmountSubunit === null ? null : payloadAmountSubunit === verifiedAmountSubunit;
    const currencyMatchesPayload =
        payloadCurrency === null || verifiedCurrency === null
            ? null
            : payloadCurrency === verifiedCurrency;

    const transaction = await prisma.transaction.findUnique({
        where: { reference },
        select: {
            id: true,
            type: true,
            status: true,
            metadata: true,
        },
    });

    let transactionUpdated = false;
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

        if (transaction.status === TransactionStatus.PENDING && verification.status === 'SUCCESS') {
            updateData.status = TransactionStatus.COMPLETED;
        }

        await prisma.transaction.update({
            where: { id: transaction.id },
            data: updateData,
        });
        transactionUpdated = true;
    }

    const orderAudit = await appendOrderWebhookAudit({
        reference,
        eventType,
        providerEventId,
        verificationStatus: verification.status,
        verificationProviderStatus: verification.providerStatus || null,
    });

    return {
        verification,
        amountMatchesPayload,
        currencyMatchesPayload,
        transactionMatched: Boolean(transaction),
        transactionUpdated,
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
            message: 'Webhook signature verified and reconciliation completed.',
        });
    });
}
