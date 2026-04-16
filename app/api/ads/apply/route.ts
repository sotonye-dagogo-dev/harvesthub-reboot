import { NextRequest } from 'next/server';
import { rateLimitByIP, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { withApiHandler } from '@/lib/api/http';
import { processAdApplicationSubmission } from '@/lib/services/adApplicationSubmission';

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/ads/apply', async () => {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);
        return processAdApplicationSubmission(req);
    });
}
