import { NextRequest } from 'next/server';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { env } from '@/lib/config/env';
import { featureFlags } from '@/lib/config/features';
import { isPaymentProcessingEnabled } from '@/lib/config/payments';
import { UserRole } from '@/lib/constants';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';

const PAYSTACK_WEBHOOK_WHITELIST_IPS = ['52.31.139.75', '52.49.173.169', '52.214.14.220'] as const;

function getPublicSiteUrl(): string {
    return (
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'http://localhost:3000'
    );
}

export async function GET(_req: NextRequest) {
    return withApiHandler('GET /api/admin/payments/config', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);
        if (user.role !== UserRole.ADMIN) return apiError('Forbidden', 403);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const siteUrl = getPublicSiteUrl();

        return apiSuccess({
            gateway: 'PAYSTACK',
            mode: env.paystackMode,
            paymentsEnabled: isPaymentProcessingEnabled(),
            paystack: {
                mode: env.paystackMode,
                callbackUrl: env.paystackCallbackUrl || null,
                dashboardWebhookUrl: `${siteUrl.replace(/\/$/, '')}/api/payments/webhook`,
                keyStatus: {
                    publicKeyConfigured: Boolean(env.paystackPublicKey),
                    secretKeyConfigured: Boolean(env.paystackSecretKey),
                    webhookSecretConfigured: Boolean(env.paystackWebhookSecret || env.paystackSecretKey),
                },
                webhooksEnabled: env.paystackWebhooksEnabled,
                whitelistIps: PAYSTACK_WEBHOOK_WHITELIST_IPS,
            },
            fallback: {
                bankTransferEnabled: featureFlags.enableBankTransferFallback,
            },
        });
    });
}
