/**
 * POST /api/vouchers/validate — Validate voucher code (buyer)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { code, orderTotal, vendorId: _vendorId, categoryId: _categoryId } = await req.json();
        if (!code) return NextResponse.json({ error: 'Voucher code is required' }, { status: 400 });

        const voucher = await prisma.voucher.findUnique({ where: { code: code.toUpperCase() } });
        if (!voucher) return NextResponse.json({ error: 'Invalid voucher code' }, { status: 404 });

        // Check active
        if (!voucher.isActive) return NextResponse.json({ error: 'Voucher is inactive' }, { status: 400 });

        // Check dates
        const now = new Date();
        if (voucher.validFrom && now < voucher.validFrom) {
            return NextResponse.json({ error: 'Voucher is not yet active' }, { status: 400 });
        }
        if (voucher.validTo && now > voucher.validTo) {
            return NextResponse.json({ error: 'Voucher has expired' }, { status: 400 });
        }

        // Check usage limits
        if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
            return NextResponse.json({ error: 'Voucher usage limit reached' }, { status: 400 });
        }

        // Check per-user limit
        if (voucher.perUserLimit) {
            const userRedemptions = await prisma.voucherRedemption.count({
                where: { voucherId: voucher.id, userId: user.userId },
            });
            if (userRedemptions >= voucher.perUserLimit) {
                return NextResponse.json({ error: 'You have already used this voucher the maximum number of times' }, { status: 400 });
            }
        }

        // Check minimum order
        if (voucher.minOrderAmount && orderTotal && orderTotal < Number(voucher.minOrderAmount)) {
            return NextResponse.json({
                error: `Minimum order amount is ₦${voucher.minOrderAmount}`,
            }, { status: 400 });
        }

        // Calculate discount
        let discount = 0;
        if (voucher.type === 'PERCENTAGE') {
            discount = (orderTotal ?? 0) * (Number(voucher.value) / 100);
            if (voucher.maxDiscount) discount = Math.min(discount, Number(voucher.maxDiscount));
        } else {
            discount = Number(voucher.value);
        }

        return NextResponse.json({
            success: true,
            voucher: {
                id: voucher.id,
                code: voucher.code,
                type: voucher.type,
                value: voucher.value,
                discount,
            },
        });
    } catch (error) {
        console.error('POST /api/vouchers/validate error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
