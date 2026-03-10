/**
 * GET   /api/admin/vouchers/[id] � Voucher detail with redemptions
 * PATCH /api/admin/vouchers/[id] � Update voucher
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const voucher = await prisma.voucher.findUnique({
            where: { id },
            include: {
                redemptions: {
                    include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
                    orderBy: { redeemedAt: 'desc' },
                    take: 50,
                },
                _count: { select: { redemptions: true } },
            },
        });

        if (!voucher) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });

        return NextResponse.json({ voucher });
    } catch (error) {
        console.error('GET /api/admin/vouchers/[id] error:', error);
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
        const existing = await prisma.voucher.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });

        const body = await req.json();
        const allowedFields = ['isActive', 'value', 'usageLimit', 'perUserLimit', 'validTo', 'maxDiscount', 'minOrderAmount', 'applicableCategories', 'applicableVendors'];
        const data: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                data[field] = field === 'validTo' ? new Date(body[field]) : body[field];
            }
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const voucher = await prisma.voucher.update({ where: { id }, data });
        return NextResponse.json({ success: true, voucher });
    } catch (error) {
        console.error('PATCH /api/admin/vouchers/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
