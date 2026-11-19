/**
 * GET /api/app-currency/config — public in-app currency settings (name, symbol, rate, limits).
 * Safe to expose: contains no balances or user data.
 */
import { prisma } from '@/lib/db/prisma';
import { apiSuccess, withApiHandler } from '@/lib/api/http';
import { getAppCurrencyConfig } from '@/lib/services/appCurrency';

export async function GET() {
    return withApiHandler('GET /api/app-currency/config', async () => {
        const config = await getAppCurrencyConfig(prisma);
        return apiSuccess({ config });
    });
}
