/**
 * GET /api/notifications/preferences — Get notification preferences
 * PUT /api/notifications/preferences — Update notification preferences
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

const SMS_NOTIFICATIONS_AVAILABLE = false;
const PREFERENCE_NOTE =
    'Critical system email notifications remain mandatory and cannot be disabled. SMS notifications are temporarily unavailable.';

type PersistedPreferenceShape = {
    orderUpdates: boolean;
    promotions: boolean;
    vendorMessages: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
};

function toPreferencesPayload(prefs: PersistedPreferenceShape) {
    return {
        note: PREFERENCE_NOTE,
        editable: {
            orderUpdates: prefs.orderUpdates,
            vendorMessages: prefs.vendorMessages,
            promotions: prefs.promotions,
            pushNotifications: prefs.pushNotifications,
            smsNotifications: SMS_NOTIFICATIONS_AVAILABLE ? prefs.smsNotifications : false,
        },
        enforced: {
            criticalEmail: true,
            criticalTypes: [
                'ORDER_CONFIRMED',
                'ORDER_READY',
                'ORDER_DELIVERED',
                'ORDER_CANCELLED',
                'PAYMENT_SUCCESS',
                'PAYMENT_FAILED',
                'DELIVERY_UPDATE',
            ],
        },
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
            emailNotifications: true,
            smsNotifications: SMS_NOTIFICATIONS_AVAILABLE ? prefs.smsNotifications : false,
            pushNotifications: prefs.pushNotifications,
            orderUpdates: prefs.orderUpdates,
        },
    };
}

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

        return apiSuccess(
            toPreferencesPayload({
                orderUpdates: prefs.orderUpdates,
                promotions: prefs.promotions,
                vendorMessages: prefs.vendorMessages,
                emailNotifications: prefs.emailNotifications,
                smsNotifications: prefs.smsNotifications,
                pushNotifications: prefs.pushNotifications,
            })
        );
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

        const editablePayload =
            incoming.editable && typeof incoming.editable === 'object'
                ? (incoming.editable as Record<string, unknown>)
                : incoming;

        const orderUpdates =
            typeof editablePayload.orderUpdates === 'boolean'
                ? editablePayload.orderUpdates
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
            typeof editablePayload.promotions === 'boolean'
                ? editablePayload.promotions
                : incoming.newProducts === true || incoming.promotions === true;

        const updateData: Record<string, boolean> = {
            emailNotifications:
                typeof editablePayload.emailNotifications === 'boolean'
                    ? editablePayload.emailNotifications
                    : true,
            smsNotifications:
                SMS_NOTIFICATIONS_AVAILABLE && typeof editablePayload.smsNotifications === 'boolean'
                    ? editablePayload.smsNotifications
                    : false,
            pushNotifications:
                typeof editablePayload.pushNotifications === 'boolean'
                    ? editablePayload.pushNotifications
                    : true,
            orderUpdates,
            promotions,
            vendorMessages:
                typeof editablePayload.vendorMessages === 'boolean'
                    ? editablePayload.vendorMessages
                    : true,
        };

        // Mandatory critical channel remains enabled regardless of optional settings.
        // Security/reliability requirement: order/payment/delivery critical communications must
        // always remain reachable by email even if users disable optional notification channels.
        updateData.emailNotifications = true;

        const prefs = await prisma.notificationPreference.upsert({
            where: { userId: user.userId },
            create: { userId: user.userId, ...updateData },
            update: updateData,
        });

        return apiSuccess(
            toPreferencesPayload({
                orderUpdates: prefs.orderUpdates,
                promotions: prefs.promotions,
                vendorMessages: prefs.vendorMessages,
                emailNotifications: prefs.emailNotifications,
                smsNotifications: prefs.smsNotifications,
                pushNotifications: prefs.pushNotifications,
            })
        );
    });
}
