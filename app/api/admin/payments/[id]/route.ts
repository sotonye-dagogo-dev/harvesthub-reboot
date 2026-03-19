/**
 * GET   /api/admin/payments/[id] � Payment detail
 * PATCH /api/admin/payments/[id] � Verify/reject payment with wallet crediting
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@/prisma/generated/client';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const payment = await prisma.advertiserPayment.findUnique({
            where: { id },
            include: {
                advertisement: true,
            },
        });
        if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

        return NextResponse.json({ success: true, payment });
    } catch (error) {
        console.error('GET /api/admin/payments/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const payment = await prisma.advertiserPayment.findUnique({
            where: { id },
            include: { advertisement: true },
        });
        if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

        const { action, rejectionReason } = await req.json();
        if (!action || !['verify', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Action must be "verify" or "reject"' }, { status: 400 });
        }

        if (action === 'verify') {
            const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                const p = await tx.advertiserPayment.update({
                    where: { id },
                    data: { status: 'VERIFIED', verifiedAt: new Date() },
                });
                // Update associated ad status
                await tx.advertisement.update({
                    where: { id: payment.advertisementId },
                    data: { status: 'PENDING_APPROVAL' },
                });
                return p;
            });
            return NextResponse.json({ success: true, payment: updated });
        } else {
            const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                const p = await tx.advertiserPayment.update({
                    where: { id },
                    data: { status: 'REJECTED' },
                });
                await tx.advertisement.update({
                    where: { id: payment.advertisementId },
                    data: { status: 'REJECTED', rejectionReason },
                });
                return p;
            });
            return NextResponse.json({ success: true, payment: updated });
        }
    } catch (error) {
        console.error('PATCH /api/admin/payments/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
