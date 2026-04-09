import { NotificationType } from '../../prisma/generated/client';
import { NOTIFICATION_TEMPLATE_CONFIG } from '@/lib/config/notificationTemplates';

type NotificationMetadata = Record<string, unknown>;

type ResolverContext = {
  type: NotificationType;
  metadata?: unknown;
  fallbackTitle?: string;
  fallbackMessage?: string;
  fallbackLink?: string | null;
  fallbackEmailSubject?: string;
  userContext?: {
    firstName?: string | null;
    signupDate?: Date | null;
  };
};

export type ResolvedNotificationTemplate = {
  title: string;
  message: string;
  link: string | null;
  emailSubject: string;
  metadata: NotificationMetadata;
};

function toMetadataRecord(value: unknown): NotificationMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as NotificationMetadata;
}

function valueOf(metadata: NotificationMetadata, key: string, fallback: string): string {
  const candidate = metadata[key];
  return typeof candidate === 'string' && candidate.trim().length > 0 ? candidate : fallback;
}

function renderTemplate(input: string, metadata: NotificationMetadata): string {
  return input.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key: string) => {
    const value = metadata[key];
    if (typeof value === 'number') return value.toLocaleString('en-NG');
    if (typeof value === 'string') return value;
    return key;
  });
}

export function resolveNotificationTemplate(context: ResolverContext): ResolvedNotificationTemplate {
  const template = NOTIFICATION_TEMPLATE_CONFIG[context.type];
  const metadata = toMetadataRecord(context.metadata);

  const mergedMetadata: NotificationMetadata = {
    ...metadata,
    orderNumber: valueOf(metadata, 'orderNumber', 'your order'),
    deliveryStatus: valueOf(metadata, 'deliveryStatus', 'Delivery update available'),
    vendorName: valueOf(metadata, 'vendorName', 'A vendor'),
    productName: valueOf(metadata, 'productName', 'a product'),
    promoTitle: valueOf(metadata, 'promoTitle', 'A new offer'),
    signupDate:
      context.userContext?.signupDate instanceof Date
        ? context.userContext.signupDate.toISOString()
        : metadata.signupDate,
    recipientFirstName: context.userContext?.firstName ?? metadata.recipientFirstName,
  };

  const resolvedTitle = context.fallbackTitle || renderTemplate(template.title, mergedMetadata);
  const resolvedMessage = context.fallbackMessage || renderTemplate(template.body, mergedMetadata);
  const resolvedLink = context.fallbackLink ?? template.defaultLink ?? '/notifications';

  return {
    title: resolvedTitle,
    message: resolvedMessage,
    link: resolvedLink,
    emailSubject: context.fallbackEmailSubject || resolvedTitle,
    metadata: mergedMetadata,
  };
}
