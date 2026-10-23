/**
 * GET /api/subscription-packages — Public list of active subscription packages.
 *
 * Returns an empty list (with `subscriptionsEnabled: false`) when the admin has
 * disabled the subscription-packages model, so clients can render an explicit
 * "not currently offered" state instead of erroring.
 */
import { prisma } from '@/lib/db/prisma';
import { apiSuccess, withApiHandler } from '@/lib/api/http';
import { getPaymentModelsConfig } from '@/lib/services/subscriptions';

export async function GET() {
    return withApiHandler('GET /api/subscription-packages', async () => {
        const config = await getPaymentModelsConfig(prisma);

        if (!config.subscriptionEnabled) {
            return apiSuccess({
                packages: [],
                subscriptionsEnabled: false,
                enforcementLevel: config.subscriptionEnforcementLevel,
            });
        }

        const packages = await prisma.subscriptionPackage.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                price: true,
                durationDays: true,
                features: true,
                sortOrder: true,
            },
        });

        return apiSuccess({
            packages,
            subscriptionsEnabled: true,
            enforcementLevel: config.subscriptionEnforcementLevel,
        });
    });
}
