/**
 * GET /api/admin/app-currency — in-app currency settings + circulation stats (ADMIN only)
 * PUT /api/admin/app-currency — update settings (ADMIN only). Partial updates.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';
import { UserRole } from '@/lib/constants';
import {
    getAppCurrencyConfig,
    roundMoney,
    updateAppCurrencyConfig,
    type AppCurrencyConfig,
} from '@/lib/services/appCurrency';

async function getStats() {
    const [circulation, holders, byType] = await Promise.all([
        prisma.wallet.aggregate({ _sum: { coinBalance: true } }),
        prisma.wallet.count({ where: { coinBalance: { gt: 0 } } }),
        prisma.coinTransaction.groupBy({
            by: ['type'],
            _sum: { amount: true, nairaValue: true },
            _count: { _all: true },
        }),
    ]);

    return {
        coinsInCirculation: roundMoney(circulation._sum.coinBalance ?? 0),
        holders,
        totals: byType.map((row) => ({
            type: row.type,
            count: row._count._all,
            coins: roundMoney(row._sum.amount ?? 0),
            naira: roundMoney(row._sum.nairaValue ?? 0),
        })),
    };
}

type AdminCheck = { ok: true; userId: string } | { ok: false; response: NextResponse };

async function requireAdmin(): Promise<AdminCheck> {
    const user = await getCurrentUser();
    if (!user) return { ok: false, response: apiError('Unauthorized', 401) };
    if (user.role !== UserRole.ADMIN) return { ok: false, response: apiError('Forbidden', 403) };
    const rl = await rateLimitByUser(user.userId);
    if (!rl.success) {
        return { ok: false, response: getRateLimitResponse(rl) };
    }
    return { ok: true, userId: user.userId };
}

export async function GET(_req: NextRequest) {
    return withApiHandler('GET /api/admin/app-currency', async () => {
        const auth = await requireAdmin();
        if (!auth.ok) return auth.response;

        const [config, stats] = await Promise.all([getAppCurrencyConfig(prisma), getStats()]);
        return apiSuccess({ config, stats });
    });
}

export async function PUT(req: NextRequest) {
    return withApiHandler('PUT /api/admin/app-currency', async () => {
        const auth = await requireAdmin();
        if (!auth.ok) return auth.response;

        const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
        const patch: Partial<AppCurrencyConfig> = {};

        for (const field of ['enabled', 'checkoutEnabled'] as const) {
            if (body[field] === undefined) continue;
            if (typeof body[field] !== 'boolean') return apiError(`${field} must be true or false`, 400);
            patch[field] = body[field] as boolean;
        }

        for (const field of ['name', 'symbol'] as const) {
            if (body[field] === undefined) continue;
            const value = typeof body[field] === 'string' ? (body[field] as string).trim() : '';
            const max = field === 'name' ? 40 : 8;
            if (!value || value.length > max) return apiError(`${field} must be 1–${max} characters`, 400);
            patch[field] = value;
        }

        for (const field of ['nairaPerUnit', 'minConversion', 'maxConversion'] as const) {
            if (body[field] === undefined) continue;
            const value = Number(body[field]);
            if (!Number.isFinite(value) || value < 0) return apiError(`${field} must be a positive number`, 400);
            if (field === 'nairaPerUnit' && (value < 0.01 || value > 1_000_000)) {
                return apiError('nairaPerUnit must be between 0.01 and 1,000,000', 400);
            }
            patch[field] = value;
        }

        const current = await getAppCurrencyConfig(prisma);
        const min = patch.minConversion ?? current.minConversion;
        const max = patch.maxConversion ?? current.maxConversion;
        if (max < min) return apiError('maxConversion must be greater than or equal to minConversion', 400);

        const config = await updateAppCurrencyConfig(prisma, patch);
        console.info('[app-currency] settings updated', { by: auth.userId, patch });
        return apiSuccess({ config, stats: await getStats() });
    });
}
