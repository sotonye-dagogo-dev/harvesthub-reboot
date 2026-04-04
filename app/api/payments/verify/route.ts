import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';
import { verifyPayment } from '@/lib/services/payments';

const verifySchema = z.object({
    gateway: z.enum(['PAYSTACK', 'FLUTTERWAVE']),
    reference: z.string().trim().min(6).max(100),
});

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/payments/verify', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const parsed = verifySchema.safeParse(await req.json());
        if (!parsed.success) {
            return apiError('Invalid request payload', 400, {
                details: parsed.error.flatten(),
            });
        }

        const verification = await verifyPayment(parsed.data);

        return apiSuccess({
            verification,
            note: 'Gateway verification is currently a stub. Replace with provider transaction lookup.',
        });
    });
}
