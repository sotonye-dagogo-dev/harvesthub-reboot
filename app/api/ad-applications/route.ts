import { NextRequest } from 'next/server';
import { db } from '@/lib/data/database';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';
import { z } from 'zod';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { processAdApplicationSubmission } from '@/lib/services/adApplicationSubmission';

const adApplicationStatusSchema = z.enum([
    'PENDING',
    'PENDING_PAYMENT',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'ACTIVE',
    'EXPIRED',
]);

export async function GET(req: NextRequest) {
    return withApiHandler('GET /api/ad-applications', async () => {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return apiError('Unauthorized', 403);
        }

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const searchParams = new URL(req.url).searchParams;
        const rawStatus = searchParams.get('status');

        let status: string | undefined = undefined;
        if (rawStatus) {
            const parsedStatus = adApplicationStatusSchema.safeParse(rawStatus.toUpperCase());
            if (!parsedStatus.success) {
                return apiError('Invalid status filter', 400);
            }
            status = parsedStatus.data;
        }

        let applications;
        try {
            applications = await db.adApplications.findAll({ status });
        } catch (innerError) {
            console.error('GET /api/ad-applications database error:', innerError);
            // If database access fails, return a safe empty response for admin UIs.
            return apiError('Failed to fetch ad applications (database error)', 500);
        }

        return apiSuccess({ applications });
    });
}

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/ad-applications', async () => {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);
        return processAdApplicationSubmission(req);
    });
}
