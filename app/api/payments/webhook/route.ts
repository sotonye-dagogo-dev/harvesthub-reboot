import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { env } from '@/lib/config/env';

function isSignatureValid(signature: string, rawBody: string, secretKey: string): boolean {
    const computed = createHmac('sha512', secretKey).update(rawBody).digest('hex');

    const providedBuffer = Buffer.from(signature, 'utf8');
    const computedBuffer = Buffer.from(computed, 'utf8');
    if (providedBuffer.length !== computedBuffer.length) return false;

    return timingSafeEqual(providedBuffer, computedBuffer);
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

        let payload: {
            event?: unknown;
            data?: { reference?: unknown };
        } = {};
        try {
            payload = JSON.parse(rawBody || '{}') as {
                event?: unknown;
                data?: { reference?: unknown };
            };
        } catch {
            return apiError('Invalid webhook payload', 400);
        }
        const eventType = typeof payload.event === 'string' ? payload.event : 'unknown';
        const reference = typeof payload.data?.reference === 'string' ? payload.data.reference : null;

        return apiSuccess({
            acknowledged: true,
            eventType,
            reference,
            paystackMode: env.paystackMode,
            message:
                'Webhook signature verified. Add idempotent mutation handling before production cutover.',
        });
    });
}
