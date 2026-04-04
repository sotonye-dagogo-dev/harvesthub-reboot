import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';
import { initializePayment } from '@/lib/services/payments';

const initializeSchema = z.object({
    gateway: z.enum(['PAYSTACK', 'FLUTTERWAVE']),
    amount: z.coerce.number().min(100, 'Amount must be at least 100'),
    email: z.string().trim().email('Valid email is required').optional(),
    currency: z.string().trim().min(3).max(3).optional(),
    reference: z.string().trim().min(6).max(100).optional(),
    callbackUrl: z.string().trim().url().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/payments/initialize', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const parsed = initializeSchema.safeParse(await req.json());
        if (!parsed.success) {
            return apiError('Invalid request payload', 400, {
                details: parsed.error.flatten(),
            });
        }

        const payload = parsed.data;
        const initialized = await initializePayment({
            gateway: payload.gateway,
            amount: payload.amount,
            email: payload.email || user.email,
            currency: payload.currency,
            reference: payload.reference,
            callbackUrl: payload.callbackUrl,
            metadata: payload.metadata,
        });

        return apiSuccess({
            payment: initialized,
            note: 'Gateway initialization is currently a stub. Replace with provider SDK/API calls.',
        });
    });
}
