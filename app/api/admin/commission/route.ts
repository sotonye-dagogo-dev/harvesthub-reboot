/**
 * GET /api/admin/commission — List all category commission configs
 * PUT /api/admin/commission — Upsert category commission rates
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole, VendorCategory, CATEGORY_COMMISSION_DEFAULTS } from '@/lib/constants';

export async function GET(_req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const configs = await prisma.commissionConfig.findMany({ orderBy: { category: 'asc' } });

        // Merge DB configs with defaults for categories without overrides
        const allCategories = Object.values(VendorCategory).map((cat) => {
            const dbConfig = configs.find((c) => c.category === cat);
            return {
                category: cat,
                rate: dbConfig ? dbConfig.rate : CATEGORY_COMMISSION_DEFAULTS[cat],
                isOverridden: !!dbConfig,
            };
        });

        return NextResponse.json({ success: true, commissionConfigs: allCategories });
    } catch (error) {
        console.error('GET /api/admin/commission error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { rates } = body as { rates: { category: string; rate: number }[] };

        if (!Array.isArray(rates)) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const validCategories = new Set(Object.values(VendorCategory));
        const results = await prisma.$transaction(
            rates
                .filter((r) => validCategories.has(r.category as VendorCategory) && r.rate >= 0 && r.rate <= 1)
                .map((r) =>
                    prisma.commissionConfig.upsert({
                        where: { category: r.category as VendorCategory },
                        update: { rate: r.rate },
                        create: { category: r.category as VendorCategory, rate: r.rate },
                    })
                )
        );

        return NextResponse.json({ success: true, updated: results.length });
    } catch (error) {
        console.error('PUT /api/admin/commission error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
