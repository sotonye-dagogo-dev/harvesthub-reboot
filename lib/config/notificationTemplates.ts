import { NotificationType } from '../../prisma/generated/client';

export type NotificationTemplateConfig = {
  title: string;
  body: string;
  ctaLabel?: string;
  defaultLink?: string;
  priority: 'high' | 'medium' | 'low';
  mediaHint?: 'order' | 'payment' | 'delivery' | 'promo' | 'vendor' | 'stock';
};

export const NOTIFICATION_TEMPLATE_CONFIG: Record<NotificationType, NotificationTemplateConfig> = {
  ORDER_CONFIRMED: {
    title: 'Order Confirmed',
    body: 'Your order {{orderNumber}} has been confirmed.',
    ctaLabel: 'View order',
    defaultLink: '/orders',
    priority: 'high',
    mediaHint: 'order',
  },
  ORDER_READY: {
    title: 'Order Ready for Pickup',
    body: 'Your order {{orderNumber}} is ready.',
    ctaLabel: 'Track order',
    defaultLink: '/orders',
    priority: 'high',
    mediaHint: 'order',
  },
  ORDER_DELIVERED: {
    title: 'Order Delivered',
    body: 'Order {{orderNumber}} has been delivered.',
    ctaLabel: 'Open order',
    defaultLink: '/orders',
    priority: 'high',
    mediaHint: 'delivery',
  },
  ORDER_CANCELLED: {
    title: 'Order Cancelled',
    body: 'Order {{orderNumber}} was cancelled.',
    ctaLabel: 'View details',
    defaultLink: '/orders',
    priority: 'high',
    mediaHint: 'order',
  },
  PAYMENT_SUCCESS: {
    title: 'Payment Successful',
    body: 'Payment for {{orderNumber}} was successful.',
    ctaLabel: 'View payment',
    defaultLink: '/wallet',
    priority: 'high',
    mediaHint: 'payment',
  },
  PAYMENT_FAILED: {
    title: 'Payment Failed',
    body: 'Payment for {{orderNumber}} could not be completed.',
    ctaLabel: 'Try again',
    defaultLink: '/checkout',
    priority: 'high',
    mediaHint: 'payment',
  },
  DELIVERY_UPDATE: {
    title: 'Delivery Update',
    body: '{{deliveryStatus}} for order {{orderNumber}}.',
    ctaLabel: 'Track delivery',
    defaultLink: '/orders',
    priority: 'medium',
    mediaHint: 'delivery',
  },
  VENDOR_MESSAGE: {
    title: 'New Vendor Message',
    body: '{{vendorName}} sent you an update.',
    ctaLabel: 'Open message',
    defaultLink: '/orders',
    priority: 'medium',
    mediaHint: 'vendor',
  },
  LOW_STOCK: {
    title: 'Low Stock Alert',
    body: '{{productName}} is running low in stock.',
    ctaLabel: 'View product',
    defaultLink: '/products',
    priority: 'medium',
    mediaHint: 'stock',
  },
  NEW_PRODUCT: {
    title: 'New Product Available',
    body: '{{vendorName}} just listed {{productName}}.',
    ctaLabel: 'See product',
    defaultLink: '/products',
    priority: 'low',
    mediaHint: 'promo',
  },
  PROMOTION: {
    title: 'New Promotion',
    body: '{{promoTitle}} is now live.',
    ctaLabel: 'View offer',
    defaultLink: '/products',
    priority: 'low',
    mediaHint: 'promo',
  },
};
