/**
 * GET  /api/admin/vouchers — List vouchers
 * POST /api/admin/vouchers — Create single or bulk vouchers
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { VoucherType } from '@prisma/client';
import { UserRole } from '@/lib/constants';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const isActive = searchParams.get('isActive');
        const type = searchParams.get('type') as VoucherType | null;
        const search = searchParams.get('search');

        const where: Record<string, unknown> = {};
        if (isActive !== null) where.isActive = isActive === 'true';
        if (type && Object.values(VoucherType).includes(type)) where.type = type;
        if (search) where.code = { contains: search, mode: 'insensitive' };

        const [vouchers, total] = await Promise.all([
            prisma.voucher.findMany({
                where,
                include: { _count: { select: { redemptions: true } } },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.voucher.count({ where }),
        ]);

        return NextResponse.json({
            vouchers,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GET /api/admin/vouchers error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function generateVoucherCode(prefix: string = ''): string {
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return prefix ? `${prefix}-${random}` : random;
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { bulk, count, prefix, ...voucherData } = body;

        // Validate required fields
        if (!voucherData.type || !voucherData.value || !voucherData.validFrom || !voucherData.validTo) {
            return NextResponse.json({ error: 'Missing required fields: type, value, validFrom, validTo' }, { status: 400 });
        }
        if (!Object.values(VoucherType).includes(voucherData.type)) {
            return NextResponse.json({ error: 'Invalid voucher type' }, { status: 400 });
        }
        if (voucherData.value <= 0) {
            return NextResponse.json({ error: 'Value must be positive' }, { status: 400 });
        }
        if (new Date(voucherData.validTo) <= new Date(voucherData.validFrom)) {
            return NextResponse.json({ error: 'validTo must be after validFrom' }, { status: 400 });
        }

        const baseData = {
            type: voucherData.type as VoucherType,
            value: voucherData.value,
            minOrderAmount: voucherData.minOrderAmount ?? 0,
            maxDiscount: voucherData.maxDiscount ?? null,
            usageLimit: voucherData.usageLimit ?? null,
            perUserLimit: voucherData.perUserLimit ?? 1,
            validFrom: new Date(voucherData.validFrom),
            validTo: new Date(voucherData.validTo),
            isActive: voucherData.isActive ?? true,
            applicableCategories: voucherData.applicableCategories ?? [],
            applicableVendors: voucherData.applicableVendors ?? [],
            createdBy: user.userId,
        };

        if (bulk) {
            const amount = Math.min(500, Math.max(1, parseInt(count) || 10));
            const codes: string[] = [];

            // Generate unique codes
            for (let i = 0; i < amount; i++) {
                codes.push(generateVoucherCode(prefix || ''));
            }

            const created = await prisma.voucher.createMany({
                data: codes.map((code) => ({ ...baseData, code })),
                skipDuplicates: true,
            });

            return NextResponse.json(
                { success: true, message: `Created ${created.count} vouchers`, count: created.count },
                { status: 201 }
            );
        }

        // Single voucher
        const code = voucherData.code || generateVoucherCode(prefix || '');
        const existing = await prisma.voucher.findUnique({ where: { code } });
        if (existing) return NextResponse.json({ error: 'Voucher code already exists' }, { status: 409 });

        const voucher = await prisma.voucher.create({ data: { ...baseData, code } });
        return NextResponse.json({ success: true, voucher }, { status: 201 });
    } catch (error) {
        console.error('POST /api/admin/vouchers error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
