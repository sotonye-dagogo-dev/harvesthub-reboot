import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { cisConfig, verifyCisWebhookSignature } from '@/lib/config/cis';
import { recordCisWebhookEvent } from '@/lib/data/cisIdentity';

const CisWebhookSchema = z.object({
    eventType: z.string().trim().min(1),
    sourcePlatform: z.string().trim().min(1),
    subjectId: z.string().trim().min(1).optional(),
    externalUserId: z.string().trim().min(1).optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    if (!rawBody.trim()) {
        return NextResponse.json({ success: false, error: 'Empty webhook payload' }, { status: 400 });
    }

    if (cisConfig.webhookSecret) {
        const signature = req.headers.get('x-cis-signature');
        const timestamp = req.headers.get('x-cis-timestamp');

        if (!verifyCisWebhookSignature({ payload: rawBody, signature, timestamp })) {
            return NextResponse.json({ success: false, error: 'Invalid CIS webhook signature' }, { status: 401 });
        }
    } else if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'CIS webhook is not configured' }, { status: 503 });
    }

    let parsedBody: unknown;
    try {
        parsedBody = JSON.parse(rawBody) as unknown;
    } catch {
        return NextResponse.json({ success: false, error: 'Webhook payload must be valid JSON' }, { status: 400 });
    }

    const parsed = CisWebhookSchema.safeParse(parsedBody);
    if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 });
    }

    const persistence = await recordCisWebhookEvent({
        eventType: parsed.data.eventType,
        sourcePlatform: parsed.data.sourcePlatform,
        subjectId: parsed.data.subjectId,
        externalUserId: parsed.data.externalUserId,
        payload: parsed.data.payload,
    });

    return NextResponse.json(
        {
            success: true,
            data: {
                accepted: true,
                platformSlug: cisConfig.platformSlug,
                eventType: parsed.data.eventType,
                sourcePlatform: parsed.data.sourcePlatform,
                subjectId: parsed.data.subjectId ?? null,
                externalUserId: parsed.data.externalUserId ?? null,
                identityRecorded: Boolean(persistence.identityId),
            },
        },
        { status: 202 },
    );
}