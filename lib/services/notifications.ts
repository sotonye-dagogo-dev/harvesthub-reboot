import { prisma } from '@/lib/db/prisma';
import { featureFlags } from '@/lib/config/features';
import {
  sendOrderConfirmationEmail,
  sendNotificationEmail,
  sendOrderStatusUpdateEmail,
} from '@/lib/services/email';
import { sendPushNotification } from '@/lib/services/push';
import { NotificationType, Prisma } from '../../prisma/generated/client';
import { resolveNotificationTemplate } from '@/lib/services/notificationTemplateResolver';

interface DeliveryChannels {
  inApp?: boolean;
  email?: boolean;
  push?: boolean;
}

interface DispatchNotificationInput {
  userId: string;
  type: NotificationType;
  title?: string;
  message?: string;
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

const MANDATORY_EMAIL_TYPES = new Set<NotificationType>([
  'ORDER_CONFIRMED',
  'ORDER_READY',
  'ORDER_DELIVERED',
  'ORDER_CANCELLED',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'DELIVERY_UPDATE',
]);

function isMandatorySystemEmail(type: NotificationType): boolean {
  return MANDATORY_EMAIL_TYPES.has(type);
}

function toAbsoluteLink(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://harvesthub.ng';
  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${appUrl}${normalizedPath}`;
}

function toMetadataString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return value.toLocaleString('en-NG');
  return null;
}

function toMetadataCurrency(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `₦${value.toLocaleString('en-NG')}`;
  }
  return null;
}

function buildNotificationEmailDetails(metadata: Record<string, unknown>) {
  const rows: { label: string; value: string }[] = [];
  const explicitDetails = metadata.details;

  if (Array.isArray(explicitDetails)) {
    for (const detail of explicitDetails) {
      if (
        detail &&
        typeof detail === 'object' &&
        !Array.isArray(detail) &&
        typeof (detail as Record<string, unknown>).label === 'string' &&
        typeof (detail as Record<string, unknown>).value === 'string'
      ) {
        rows.push({
          label: (detail as Record<string, unknown>).label as string,
          value: (detail as Record<string, unknown>).value as string,
        });
      }
    }
  }

  const addRow = (label: string, value: string | null) => {
    if (value) rows.push({ label, value });
  };

  addRow('Amount', toMetadataCurrency(metadata.amount));
  addRow('Reference', toMetadataString(metadata.reference));
  addRow('Gateway', toMetadataString(metadata.gateway));
  addRow('Order Number', toMetadataString(metadata.orderNumber));
  addRow('Order', toMetadataString(metadata.orderNumber));
  addRow('Status', toMetadataString(metadata.status) || toMetadataString(metadata.deliveryStatus));
  addRow('Vendor', toMetadataString(metadata.vendorName));
  addRow('Product', toMetadataString(metadata.productName));
  addRow('Pending reason', toMetadataString(metadata.pendingReason));
  addRow('Payment status', toMetadataString(metadata.paymentStatus));

  return rows;
}

function isPushKeyRecord(value: unknown): value is { p256dh: string; auth: string } {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as { p256dh?: unknown; auth?: unknown };
  return typeof maybe.p256dh === 'string' && typeof maybe.auth === 'string';
}

const ORDER_TEMPLATE_TYPES = new Set<NotificationType>([
  'ORDER_CONFIRMED',
  'ORDER_READY',
  'ORDER_DELIVERED',
  'ORDER_CANCELLED',
  'DELIVERY_UPDATE',
]);

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toDeliveryMethod(value: unknown): 'PICKUP' | 'DELIVERY' {
  return value === 'PICKUP' ? 'PICKUP' : 'DELIVERY';
}

function toOrderStatusForTemplate(type: NotificationType, metadata: Record<string, unknown>): string {
  if (type === 'ORDER_CONFIRMED') return 'CONFIRMED';
  if (type === 'ORDER_READY') return 'READY_FOR_PICKUP';
  if (type === 'ORDER_DELIVERED') return 'DELIVERED';
  if (type === 'ORDER_CANCELLED') return 'CANCELLED';

  const hintedStatus = toStringValue(metadata.status || metadata.deliveryStatus, '').toUpperCase();
  if (
    [
      'CONFIRMED',
      'PROCESSING',
      'READY_FOR_PICKUP',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
    ].includes(hintedStatus)
  ) {
    return hintedStatus;
  }

  return 'PROCESSING';
}

function formatAddressValue(address: unknown): string | undefined {
  if (!address) return undefined;
  if (typeof address === 'string') return address;
  if (typeof address === 'object' && !Array.isArray(address)) {
    const candidate = address as Record<string, unknown>;
    const chunks = [candidate.street, candidate.city, candidate.state, candidate.country]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean);
    if (chunks.length > 0) {
      return chunks.join(', ');
    }
  }
  return undefined;
}

function deriveOrderIdFromMetadata(metadata: Record<string, unknown>): string | null {
  const direct = toStringValue(metadata.orderId, '');
  if (direct) return direct;

  const orderIds = metadata.orderIds;
  if (Array.isArray(orderIds)) {
    const firstId = orderIds.find((value) => typeof value === 'string' && value.trim().length > 0);
    return typeof firstId === 'string' ? firstId : null;
  }

  return null;
}

async function sendOrderTemplateEmail(params: {
  type: NotificationType;
  recipientEmail: string;
  recipientFirstName: string;
  recipientRole: string;
  metadata: Record<string, unknown>;
}): Promise<boolean> {
  const { type, recipientEmail, recipientFirstName, recipientRole, metadata } = params;

  const orderId = deriveOrderIdFromMetadata(metadata);
  const order = orderId
    ? await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          select: {
            productName: true,
            quantity: true,
            price: true,
          },
        },
        vendor: {
          select: {
            storeName: true,
          },
        },
      },
    })
    : null;

  const orderNumber = toStringValue(order?.orderNumber || metadata.orderNumber, 'MHH-ORDER');
  const orderGroupId = toStringValue(metadata.orderGroupId, '') || undefined;
  const vendorName = toStringValue(order?.vendor?.storeName || metadata.vendorName, 'MyHarvestHub Vendor');
  const subtotal = toNumberValue(order?.subtotal, toNumberValue(metadata.subtotal));
  const deliveryFee = toNumberValue(order?.deliveryFee, toNumberValue(metadata.deliveryFee));
  const total = toNumberValue(order?.total, toNumberValue(metadata.total));
  const deliveryMethod = toDeliveryMethod(order?.deliveryMethod || metadata.deliveryMethod);
  const pickupDetails =
    order && order.pickupDetails && typeof order.pickupDetails === 'object' && !Array.isArray(order.pickupDetails)
      ? (order.pickupDetails as Record<string, unknown>)
      : null;
  const pickupService = toStringValue(pickupDetails?.pickupService, '') || undefined;
  const deliveryAddress = formatAddressValue(order?.deliveryAddress || metadata.deliveryAddress);

  const items =
    order && order.items.length > 0
      ? order.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.price,
      }))
      : [
        {
          name: toStringValue(metadata.itemLabel, 'Order items'),
          quantity: Math.max(1, toNumberValue(metadata.totalQuantity, toNumberValue(metadata.itemCount, 1))),
          price: total,
        },
      ];

  if (type === 'ORDER_CONFIRMED' && recipientRole === 'BUYER') {
    const result = await sendOrderConfirmationEmail(recipientEmail, {
      firstName: recipientFirstName,
      orderNumber,
      orderGroupId,
      items,
      subtotal,
      deliveryFee,
      total,
      deliveryMethod,
      pickupService,
      deliveryAddress,
      vendorName,
    });

    return result.success;
  }

  const result = await sendOrderStatusUpdateEmail(recipientEmail, {
    firstName: recipientFirstName,
    orderGroupId,
    orderNumber,
    status: toOrderStatusForTemplate(type, metadata),
    vendorName,
    total,
    paymentStatus: toStringValue(order?.paymentStatus, toStringValue(metadata.paymentStatus, '')) || undefined,
    note: toStringValue(metadata.note, ''),
  });

  return result.success;
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
      select: { email: true, firstName: true, createdAt: true, role: true },
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

  let inAppCreated = false;
  let emailSent = false;
  let pushDeliveredCount = 0;

  const resolvedTemplate = resolveNotificationTemplate({
    type,
    metadata,
    fallbackTitle: title,
    fallbackMessage: message,
    fallbackLink: link,
    fallbackEmailSubject: emailSubject,
    userContext: {
      firstName: recipient.firstName,
      signupDate: recipient.createdAt,
    },
  });

  const allowOptionalChannels = typeEnabled;

  if (requestedChannels.inApp && allowOptionalChannels) {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title: resolvedTemplate.title,
        message: resolvedTemplate.message,
        link: resolvedTemplate.link || null,
        metadata: resolvedTemplate.metadata as Prisma.InputJsonValue,
      },
    });
    inAppCreated = true;
  }

  const canSendEmail =
    requestedChannels.email &&
    featureFlags.enableEmail &&
    (isMandatorySystemEmail(type) ||
      (allowOptionalChannels && (preferences?.emailNotifications ?? true)));

  if (canSendEmail) {
    const metadataRecord =
      resolvedTemplate.metadata && typeof resolvedTemplate.metadata === 'object' && !Array.isArray(resolvedTemplate.metadata)
        ? (resolvedTemplate.metadata as Record<string, unknown>)
        : {};

    if (ORDER_TEMPLATE_TYPES.has(type)) {
      emailSent = await sendOrderTemplateEmail({
        type,
        recipientEmail: recipient.email,
        recipientFirstName: recipient.firstName || 'there',
        recipientRole: recipient.role,
        metadata: metadataRecord,
      });
    }

    if (!emailSent) {
      const actionLink = resolvedTemplate.link ? toAbsoluteLink(resolvedTemplate.link) : null;
      const emailResult = await sendNotificationEmail(recipient.email, {
        firstName: recipient.firstName,
        title: resolvedTemplate.title,
        message: resolvedTemplate.message,
        link: actionLink,
        linkLabel: typeof resolvedTemplate.metadata.ctaLabel === 'string' ? resolvedTemplate.metadata.ctaLabel : undefined,
        details: buildNotificationEmailDetails(resolvedTemplate.metadata),
        note: typeof resolvedTemplate.metadata.note === 'string' ? resolvedTemplate.metadata.note : undefined,
        emailSubject: resolvedTemplate.emailSubject,
        type,
      });

      emailSent = emailResult.success;
    }
  }

  if (
    requestedChannels.push &&
    allowOptionalChannels &&
    featureFlags.enablePushNotifications &&
    (preferences?.pushNotifications ?? true)
  ) {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
      select: { endpoint: true, keys: true },
      take: 10,
    });

    if (subscriptions.length > 0) {
      const deliveryResults = await Promise.all(
        subscriptions.map(async (subscription) => {
          if (!isPushKeyRecord(subscription.keys)) {
            console.warn('[Notifications] Invalid push subscription key payload', {
              userId,
              type,
              endpoint: subscription.endpoint,
            });
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
            resolvedTemplate.title,
            resolvedTemplate.message,
            {
              url: resolvedTemplate.link || '/notifications',
              type,
            }
          );
        })
      );

      pushDeliveredCount = deliveryResults.filter(Boolean).length;
      const failedDeliveries = subscriptions.length - pushDeliveredCount;
      if (failedDeliveries > 0) {
        console.warn('[Notifications] Push delivery failures detected', {
          userId,
          type,
          attempted: subscriptions.length,
          delivered: pushDeliveredCount,
          failed: failedDeliveries,
        });
      }
    } else {
      console.info('[Notifications] No push subscriptions available for delivery', {
        userId,
        type,
      });
    }
  }

  return {
    inAppCreated,
    emailSent,
    pushDeliveredCount,
  };
}
