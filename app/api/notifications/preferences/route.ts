/**
 * GET /api/notifications/preferences — Get notification preferences
 * PUT /api/notifications/preferences — Update notification preferences
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function GET(_req: NextRequest) {
    return withApiHandler('GET /api/notifications/preferences', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        let prefs = await prisma.notificationPreference.findUnique({
            where: { userId: user.userId },
        });

        // Create defaults if not found
        if (!prefs) {
            prefs = await prisma.notificationPreference.create({
                data: { userId: user.userId },
            });
        }

        return apiSuccess({
            preferences: {
                orderConfirmed: prefs.orderUpdates,
                orderReady: prefs.orderUpdates,
                orderDelivered: prefs.orderUpdates,
                orderCancelled: prefs.orderUpdates,
                paymentSuccess: prefs.orderUpdates,
                paymentFailed: prefs.orderUpdates,
                deliveryUpdates: prefs.orderUpdates,
                vendorMessages: prefs.vendorMessages,
                lowStock: prefs.orderUpdates,
                newProducts: prefs.promotions,
                promotions: prefs.promotions,
                emailNotifications: prefs.emailNotifications,
                smsNotifications: prefs.smsNotifications,
                pushNotifications: prefs.pushNotifications,
                orderUpdates: prefs.orderUpdates,
            },
        });
    });
}

export async function PUT(req: NextRequest) {
    return withApiHandler('PUT /api/notifications/preferences', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const incoming = body as Record<string, unknown>;

        const orderUpdates =
            typeof incoming.orderUpdates === 'boolean'
                ? incoming.orderUpdates
                : [
                    incoming.orderConfirmed,
                    incoming.orderReady,
                    incoming.orderDelivered,
                    incoming.orderCancelled,
                    incoming.paymentSuccess,
                    incoming.paymentFailed,
                    incoming.deliveryUpdates,
                    incoming.lowStock,
                ].some((value) => value === true);

        const promotions =
            typeof incoming.promotions === 'boolean'
                ? incoming.promotions
                : incoming.newProducts === true || incoming.promotions === true;

        const updateData: Record<string, boolean> = {
            emailNotifications:
                typeof incoming.emailNotifications === 'boolean' ? incoming.emailNotifications : true,
            smsNotifications:
                typeof incoming.smsNotifications === 'boolean' ? incoming.smsNotifications : false,
            pushNotifications:
                typeof incoming.pushNotifications === 'boolean' ? incoming.pushNotifications : true,
            orderUpdates,
            promotions,
            vendorMessages:
                typeof incoming.vendorMessages === 'boolean' ? incoming.vendorMessages : true,
        };

        // Mandatory critical channel remains enabled regardless of optional settings.
        updateData.emailNotifications = true;

        const prefs = await prisma.notificationPreference.upsert({
            where: { userId: user.userId },
            create: { userId: user.userId, ...updateData },
            update: updateData,
        });

        return apiSuccess({
            preferences: {
                orderConfirmed: prefs.orderUpdates,
                orderReady: prefs.orderUpdates,
                orderDelivered: prefs.orderUpdates,
                orderCancelled: prefs.orderUpdates,
                paymentSuccess: prefs.orderUpdates,
                paymentFailed: prefs.orderUpdates,
                deliveryUpdates: prefs.orderUpdates,
                vendorMessages: prefs.vendorMessages,
                lowStock: prefs.orderUpdates,
                newProducts: prefs.promotions,
                promotions: prefs.promotions,
                emailNotifications: prefs.emailNotifications,
                smsNotifications: prefs.smsNotifications,
                pushNotifications: prefs.pushNotifications,
                orderUpdates: prefs.orderUpdates,
            },
        });
    });
}
