/**
 * GET /api/vouchers/my — Current user's available vouchers + redemption history
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { parseVoucherScope } from '@/lib/vouchers/scope';

export async function GET(_req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const now = new Date();

        // Get all active/visible vouchers
        const allVouchers = await prisma.voucher.findMany({
            where: {
                isActive: true,
                validFrom: { lte: now },
                validTo: { gte: now },
            },
            orderBy: { validTo: 'asc' },
        });

        // Get user's redemptions for per-user usage count
        const userRedemptions = await prisma.voucherRedemption.findMany({
            where: { userId: user.userId },
            include: {
                voucher: {
                    select: { id: true, code: true, type: true, value: true, validFrom: true, validTo: true, isActive: true },
                },
            },
            orderBy: { redeemedAt: 'desc' },
        });

        const userRedemptionCountByVoucher = userRedemptions.reduce<Record<string, number>>(
            (acc, r) => {
                acc[r.voucherId] = (acc[r.voucherId] ?? 0) + 1;
                return acc;
            },
            {}
        );

        const available = allVouchers
            .map((v) => {
                const scope = parseVoucherScope(v.applicableCategories, v.applicableVendors);
                return {
                    id: v.id,
                    code: v.code,
                    type: v.type,
                    value: v.value,
                    minOrderAmount: v.minOrderAmount,
                    maxDiscount: v.maxDiscount,
                    validFrom: v.validFrom,
                    validTo: v.validTo,
                    usageLimit: v.usageLimit,
                    usedCount: v.usedCount,
                    perUserLimit: v.perUserLimit,
                    userUsedCount: userRedemptionCountByVoucher[v.id] ?? 0,
                    visibility: scope.visibility,
                };
            })
            .filter((voucher) => voucher.visibility !== 'PRIVATE')
            .map(({ visibility: _visibility, ...voucher }) => voucher);

        return NextResponse.json({ available, redemptions: userRedemptions });
    } catch (error) {
        console.error('GET /api/vouchers/my error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
