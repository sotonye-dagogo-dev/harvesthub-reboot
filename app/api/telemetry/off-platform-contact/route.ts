/**
 * POST /api/telemetry/off-platform-contact - Lightweight telemetry marker for external contact handoff
 */
import { NextRequest } from 'next/server';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function POST(req: NextRequest) {
    return withApiHandler('POST /api/telemetry/off-platform-contact', async () => {
        const body = await req.json().catch(() => ({}));

        const channel = typeof body.channel === 'string' ? body.channel.trim().toUpperCase() : '';
        if (!channel) {
            return apiError('channel is required', 400);
        }

        // This is intentionally lightweight. Full analytics/event sink wiring can
        // forward this payload to a telemetry backend in a follow-up hardening pass.
        console.info('[telemetry/off-platform-contact]', {
            channel,
            vendorName: typeof body.vendorName === 'string' ? body.vendorName : null,
            maskedPhone: typeof body.maskedPhone === 'string' ? body.maskedPhone : null,
            source: typeof body.source === 'string' ? body.source : null,
            createdAt: new Date().toISOString(),
        });

        return apiSuccess({ recorded: true });
    });
}
