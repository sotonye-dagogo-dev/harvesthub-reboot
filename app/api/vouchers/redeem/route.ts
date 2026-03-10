/**
 * POST /api/vouchers/redeem — Redeem voucher on order (atomic)
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

        const { code, orderId, orderTotal } = await req.json();
        if (!code || !orderId) {
            return NextResponse.json({ error: 'code and orderId are required' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const voucher = await tx.voucher.findUnique({ where: { code: code.toUpperCase() } });
            if (!voucher) throw new Error('Invalid voucher code');
            if (!voucher.isActive) throw new Error('Voucher is inactive');

            const now = new Date();
            if (voucher.validFrom && now < voucher.validFrom) throw new Error('Voucher not yet active');
            if (voucher.validTo && now > voucher.validTo) throw new Error('Voucher has expired');
            if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) throw new Error('Voucher usage limit reached');

            if (voucher.perUserLimit) {
                const userRedemptions = await tx.voucherRedemption.count({
                    where: { voucherId: voucher.id, userId: user.userId },
                });
                if (userRedemptions >= voucher.perUserLimit) throw new Error('Per-user limit reached');
            }

            if (voucher.minOrderAmount && orderTotal < Number(voucher.minOrderAmount)) {
                throw new Error(`Minimum order amount is ₦${voucher.minOrderAmount}`);
            }

            // Calculate discount
            let discount = 0;
            if (voucher.type === 'PERCENTAGE') {
                discount = (orderTotal ?? 0) * (Number(voucher.value) / 100);
                if (voucher.maxDiscount) discount = Math.min(discount, Number(voucher.maxDiscount));
            } else {
                discount = Number(voucher.value);
            }

            // Increment usage count
            await tx.voucher.update({
                where: { id: voucher.id },
                data: { usedCount: { increment: 1 } },
            });

            // Create redemption record
            const redemption = await tx.voucherRedemption.create({
                data: {
                    voucherId: voucher.id,
                    userId: user.userId,
                    orderId,
                    discountApplied: discount,
                },
            });

            return { redemption, discount, voucher: { id: voucher.id, code: voucher.code } };
        });

        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        if (error instanceof Error) {
            console.error('POST /api/vouchers/redeem error:', error.message);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
