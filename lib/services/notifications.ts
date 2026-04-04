import * as React from 'react';
import { prisma } from '@/lib/db/prisma';
import { featureFlags } from '@/lib/config/features';
import { sendEmail } from '@/lib/services/email';
import { sendPushNotification } from '@/lib/services/push';
import { NotificationType, Prisma } from '../../prisma/generated/client';

interface DeliveryChannels {
  inApp?: boolean;
  email?: boolean;
  push?: boolean;
}

interface DispatchNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Prisma.InputJsonValue;
  emailSubject?: string;
  channels?: DeliveryChannels;
}

interface DispatchNotificationResult {
  inAppCreated: boolean;
  emailSent: boolean;
  pushDeliveredCount: number;
}

function shouldDeliverType(
  type: NotificationType,
  preferences: {
    orderUpdates: boolean;
    promotions: boolean;
    vendorMessages: boolean;
  } | null
): boolean {
  if (!preferences) return true;

  switch (type) {
    case 'ORDER_CONFIRMED':
    case 'ORDER_READY':
    case 'ORDER_DELIVERED':
    case 'ORDER_CANCELLED':
    case 'PAYMENT_SUCCESS':
    case 'PAYMENT_FAILED':
    case 'DELIVERY_UPDATE':
      return preferences.orderUpdates;
    case 'PROMOTION':
    case 'NEW_PRODUCT':
      return preferences.promotions;
    case 'VENDOR_MESSAGE':
      return preferences.vendorMessages;
    default:
      return true;
  }
}

function toAbsoluteLink(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://harvesthub.ng';
  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${appUrl}${normalizedPath}`;
}

function isPushKeyRecord(value: unknown): value is { p256dh: string; auth: string } {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as { p256dh?: unknown; auth?: unknown };
  return typeof maybe.p256dh === 'string' && typeof maybe.auth === 'string';
}

export async function dispatchNotification(
  input: DispatchNotificationInput
): Promise<DispatchNotificationResult> {
  const {
    userId,
    type,
    title,
    message,
    link,
    metadata,
    emailSubject,
    channels,
  } = input;

  const requestedChannels = {
    inApp: channels?.inApp ?? true,
    email: channels?.email ?? true,
    push: channels?.push ?? true,
  };

  const [recipient, preferences] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    }),
    prisma.notificationPreference.findUnique({
      where: { userId },
      select: {
        emailNotifications: true,
        pushNotifications: true,
        orderUpdates: true,
        promotions: true,
        vendorMessages: true,
      },
    }),
  ]);

  if (!recipient) {
    return { inAppCreated: false, emailSent: false, pushDeliveredCount: 0 };
  }

  const typeEnabled = shouldDeliverType(type, preferences);
  if (!typeEnabled) {
    return { inAppCreated: false, emailSent: false, pushDeliveredCount: 0 };
  }

  let inAppCreated = false;
  let emailSent = false;
  let pushDeliveredCount = 0;

  if (requestedChannels.inApp) {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link: link || null,
        metadata: metadata ?? undefined,
      },
    });
    inAppCreated = true;
  }

  if (requestedChannels.email && featureFlags.enableEmail && (preferences?.emailNotifications ?? true)) {
    const actionLink = link ? toAbsoluteLink(link) : null;
    const emailResult = await sendEmail({
      to: recipient.email,
      subject: emailSubject || title,
      react: React.createElement(
        'div',
        { style: { fontFamily: 'Arial, sans-serif', lineHeight: 1.6 } },
        React.createElement('p', null, `Hello ${recipient.firstName || 'there'},`),
        React.createElement('p', null, message),
        actionLink
          ? React.createElement(
              'p',
              null,
              React.createElement('a', { href: actionLink }, 'Open MyHarvestHub')
            )
          : null
      ),
      tags: [
        { name: 'category', value: 'notification' },
        { name: 'type', value: type },
      ],
    });

    emailSent = emailResult.success;
  }

  if (requestedChannels.push && featureFlags.enablePushNotifications && (preferences?.pushNotifications ?? true)) {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
      select: { endpoint: true, keys: true },
      take: 10,
    });

    if (subscriptions.length > 0) {
      const deliveryResults = await Promise.all(
        subscriptions.map(async (subscription) => {
          if (!isPushKeyRecord(subscription.keys)) {
            return false;
          }

          return sendPushNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
              },
            },
            title,
            message,
            {
              url: link || '/notifications',
              type,
            }
          );
        })
      );

      pushDeliveredCount = deliveryResults.filter(Boolean).length;
    }
  }

  return {
    inAppCreated,
    emailSent,
    pushDeliveredCount,
  };
}
