import { NextRequest } from 'next/server';
import { apiSuccess, withApiHandler } from '@/lib/api/http';

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/payments/webhook', async () => {
        const signature = req.headers.get('x-paystack-signature');
        const eventType = req.headers.get('x-paystack-event') || 'unknown';
        const payload = await req.json().catch(() => ({}));

        const webhooksEnabled = process.env.PAYSTACK_WEBHOOKS_ENABLED === 'true';
        const signatureConfigured = !!process.env.PAYSTACK_WEBHOOK_SECRET;
        const fallbackBankTransferEnabled = process.env.PAYMENT_FALLBACK_BANK_TRANSFER !== 'false';

        return apiSuccess({
            acknowledged: true,
            eventType,
            signaturePresent: !!signature,
            webhooksEnabled,
            signatureConfigured,
            fallbackBankTransferEnabled,
            message:
                'Webhook scaffolding endpoint is active. Add signature verification and idempotent mutation handling before production cutover.',
            payload,
        });
    });
}
