/**
 * GET /api/admin/commission — List all category commission configs
 * PUT /api/admin/commission — Upsert category + tier commission rates
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole, VendorCategory, CATEGORY_COMMISSION_DEFAULTS, COMMISSION_RATES } from '@/lib/constants';

const COMMERCE_CONFIG_KEY = 'default';

function clampRate(rate: unknown, fallback: number): number {
    const parsed = typeof rate === 'number' ? rate : Number(rate);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(1, Math.max(0, parsed));
}

export async function GET(_req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const configs = await prisma.commissionConfig.findMany({ orderBy: { category: 'asc' } });
        const tierConfig = await prisma.commerceLifecycleConfig.upsert({
            where: { key: COMMERCE_CONFIG_KEY },
            update: {},
            create: { key: COMMERCE_CONFIG_KEY },
            select: {
                commissionDefaultRate: true,
                commissionPremiumRate: true,
            },
        });

        // Merge DB configs with defaults for categories without overrides
        const allCategories = Object.values(VendorCategory).map((cat) => {
            const dbConfig = configs.find((c) => c.category === cat);
            return {
                category: cat,
                rate: dbConfig ? dbConfig.rate : CATEGORY_COMMISSION_DEFAULTS[cat],
                isOverridden: !!dbConfig,
            };
        });

        const tierRates = [
            {
                tier: 'DEFAULT',
                rate: clampRate(tierConfig.commissionDefaultRate, COMMISSION_RATES.DEFAULT),
            },
            {
                tier: 'PREMIUM_VENDOR',
                rate: clampRate(tierConfig.commissionPremiumRate, COMMISSION_RATES.PREMIUM_VENDOR),
            },
        ];

        return NextResponse.json({ success: true, commissionConfigs: allCategories, tierRates });
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
        const { rates, tierRates } = body as {
            rates: { category: string; rate: number }[];
            tierRates?: { tier: string; rate: number }[];
        };

        if (!Array.isArray(rates)) {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }
        if (tierRates !== undefined && !Array.isArray(tierRates)) {
            return NextResponse.json({ error: 'Invalid tier rates payload' }, { status: 400 });
        }

        const validTierRates = (tierRates ?? []).filter(
            (tierRate) =>
                (tierRate.tier === 'DEFAULT' || tierRate.tier === 'PREMIUM_VENDOR') &&
                tierRate.rate >= 0 &&
                tierRate.rate <= 1
        );
        if ((tierRates ?? []).length !== validTierRates.length) {
            return NextResponse.json({ error: 'One or more vendor tier rates are invalid' }, { status: 400 });
        }

        const validCategories = new Set(Object.values(VendorCategory));
        const categoryRatesToPersist = rates.filter(
            (r) => validCategories.has(r.category as VendorCategory) && r.rate >= 0 && r.rate <= 1
        );

        const transactionResult = await prisma.$transaction(async (tx) => {
            const categoryResults = await Promise.all(
                categoryRatesToPersist.map((r) =>
                    tx.commissionConfig.upsert({
                        where: { category: r.category as VendorCategory },
                        update: { rate: r.rate },
                        create: { category: r.category as VendorCategory, rate: r.rate },
                    })
                )
            );

            const defaultTierRate = validTierRates.find((entry) => entry.tier === 'DEFAULT')?.rate;
            const premiumTierRate = validTierRates.find((entry) => entry.tier === 'PREMIUM_VENDOR')?.rate;

            const updatedTierConfig = await tx.commerceLifecycleConfig.upsert({
                where: { key: COMMERCE_CONFIG_KEY },
                update: {
                    ...(defaultTierRate !== undefined
                        ? { commissionDefaultRate: defaultTierRate }
                        : {}),
                    ...(premiumTierRate !== undefined
                        ? { commissionPremiumRate: premiumTierRate }
                        : {}),
                },
                create: {
                    key: COMMERCE_CONFIG_KEY,
                    commissionDefaultRate: defaultTierRate ?? COMMISSION_RATES.DEFAULT,
                    commissionPremiumRate: premiumTierRate ?? COMMISSION_RATES.PREMIUM_VENDOR,
                },
                select: {
                    commissionDefaultRate: true,
                    commissionPremiumRate: true,
                },
            });

            return {
                updatedCategoryCount: categoryResults.length,
                tierRates: [
                    {
                        tier: 'DEFAULT',
                        rate: clampRate(updatedTierConfig.commissionDefaultRate, COMMISSION_RATES.DEFAULT),
                    },
                    {
                        tier: 'PREMIUM_VENDOR',
                        rate: clampRate(
                            updatedTierConfig.commissionPremiumRate,
                            COMMISSION_RATES.PREMIUM_VENDOR
                        ),
                    },
                ],
            };
        });

        return NextResponse.json({
            success: true,
            updated: transactionResult.updatedCategoryCount,
            tierRates: transactionResult.tierRates,
        });
    } catch (error) {
        console.error('PUT /api/admin/commission error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
