/**
 * PATCH /api/admin/ads/[id] � Admin approve/reject/verify ad
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { AdStatus } from '@prisma/client';
import { UserRole } from '@/lib/constants';

interface RouteContext {
    params: Promise<{ id: string }>;
}

const VALID_TRANSITIONS: Record<string, { from: AdStatus[]; to: AdStatus }> = {
    approve:        { from: [AdStatus.PENDING_APPROVAL], to: AdStatus.ACTIVE },
    reject:         { from: [AdStatus.PENDING_APPROVAL], to: AdStatus.REJECTED },
    verify_payment: { from: [AdStatus.PENDING_PAYMENT],  to: AdStatus.PENDING_APPROVAL },
};

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const ad = await prisma.advertisement.findUnique({ where: { id } });
        if (!ad) return NextResponse.json({ error: 'Ad not found' }, { status: 404 });

        const body = await req.json();
        const { action, rejectionReason } = body;

        if (!action || !['approve', 'reject', 'verify_payment'].includes(action)) {
            return NextResponse.json({ error: 'action must be one of: approve, reject, verify_payment' }, { status: 400 });
        }

        const transition = VALID_TRANSITIONS[action];
        if (!transition || !transition.from.includes(ad.status)) {
            return NextResponse.json({ error: `Cannot ${action} an ad with status ${ad.status}` }, { status: 400 });
        }

        if (action === 'reject' && !rejectionReason) {
            return NextResponse.json({ error: 'rejectionReason is required when rejecting' }, { status: 400 });
        }

        const data: Record<string, unknown> = { status: transition.to };
        if (action === 'reject') data.rejectionReason = rejectionReason;

        const updated = await prisma.advertisement.update({ where: { id }, data });
        return NextResponse.json({ success: true, ad: updated });
    } catch (error) {
        console.error('PATCH /api/admin/ads/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
