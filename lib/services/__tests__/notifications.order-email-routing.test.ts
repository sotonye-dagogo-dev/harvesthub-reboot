import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    mockPrisma,
    mockSendNotificationEmail,
    mockSendOrderConfirmationEmail,
    mockSendOrderStatusUpdateEmail,
    mockResolveNotificationTemplate,
} = vi.hoisted(() => ({
    mockPrisma: {
        user: { findUnique: vi.fn() },
        notificationPreference: { findUnique: vi.fn() },
        notification: { create: vi.fn() },
        order: { findUnique: vi.fn() },
        pushSubscription: { findMany: vi.fn() },
    },
    mockSendNotificationEmail: vi.fn(),
    mockSendOrderConfirmationEmail: vi.fn(),
    mockSendOrderStatusUpdateEmail: vi.fn(),
    mockResolveNotificationTemplate: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
    prisma: mockPrisma,
}));

vi.mock('@/lib/config/features', () => ({
    featureFlags: {
        enableEmail: true,
        enablePushNotifications: false,
    },
}));

vi.mock('@/lib/services/email', () => ({
    sendNotificationEmail: (...args: unknown[]) => mockSendNotificationEmail(...args),
    sendOrderConfirmationEmail: (...args: unknown[]) => mockSendOrderConfirmationEmail(...args),
    sendOrderStatusUpdateEmail: (...args: unknown[]) => mockSendOrderStatusUpdateEmail(...args),
}));

vi.mock('@/lib/services/push', () => ({
    sendPushNotification: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/services/notificationTemplateResolver', () => ({
    resolveNotificationTemplate: (...args: unknown[]) => mockResolveNotificationTemplate(...args),
}));

import { dispatchNotification } from '@/lib/services/notifications';

describe('dispatchNotification order email routing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.user.findUnique.mockResolvedValue({
            email: 'buyer@example.com',
            firstName: 'Grace',
            createdAt: new Date('2026-04-01T00:00:00Z'),
            role: 'BUYER',
        });
        mockPrisma.notificationPreference.findUnique.mockResolvedValue({
            emailNotifications: true,
            pushNotifications: false,
            orderUpdates: true,
            promotions: true,
            vendorMessages: true,
        });
        mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });
        mockPrisma.pushSubscription.findMany.mockResolvedValue([]);
        mockResolveNotificationTemplate.mockImplementation(({ fallbackTitle, fallbackMessage, fallbackLink, fallbackEmailSubject, metadata }) => ({
            title: fallbackTitle || 'Title',
            message: fallbackMessage || 'Message',
            link: fallbackLink || '/orders',
            emailSubject: fallbackEmailSubject || 'Subject',
            metadata: metadata || {},
        }));
        mockSendOrderConfirmationEmail.mockResolvedValue({ success: true });
        mockSendOrderStatusUpdateEmail.mockResolvedValue({ success: true });
        mockSendNotificationEmail.mockResolvedValue({ success: true });
    });

    it('uses OrderConfirmation template for buyer ORDER_CONFIRMED notifications', async () => {
        mockPrisma.order.findUnique.mockResolvedValue({
            id: 'order-1',
            orderNumber: 'MHH-111',
            subtotal: 4000,
            deliveryFee: 500,
            total: 4500,
            deliveryMethod: 'DELIVERY',
            deliveryAddress: '12 Orchard Street',
            pickupDetails: null,
            paymentStatus: 'PAID',
            vendor: { storeName: 'Fresh Foods' },
            items: [{ productName: 'Tomatoes', quantity: 2, price: 2000 }],
        });

        const result = await dispatchNotification({
            userId: 'user-1',
            type: 'ORDER_CONFIRMED',
            title: 'Order placed',
            message: 'Order MHH-111 confirmed',
            link: '/orders',
            metadata: { orderId: 'order-1', orderNumber: 'MHH-111' },
        });

        expect(result.emailSent).toBe(true);
        expect(mockSendOrderConfirmationEmail).toHaveBeenCalledTimes(1);
        expect(mockSendNotificationEmail).not.toHaveBeenCalled();
    });

    it('uses OrderStatusUpdate template for vendor ORDER_CONFIRMED notifications', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            email: 'vendor@example.com',
            firstName: 'Victor',
            createdAt: new Date('2026-04-01T00:00:00Z'),
            role: 'VENDOR',
        });
        mockPrisma.order.findUnique.mockResolvedValue({
            id: 'order-2',
            orderNumber: 'MHH-222',
            subtotal: 5000,
            deliveryFee: 0,
            total: 5000,
            deliveryMethod: 'PICKUP',
            deliveryAddress: null,
            pickupDetails: { pickupService: 'SUNDAY_FIRST' },
            paymentStatus: 'PAID',
            vendor: { storeName: 'Harvest Store' },
            items: [{ productName: 'Bread', quantity: 1, price: 5000 }],
        });

        const result = await dispatchNotification({
            userId: 'user-2',
            type: 'ORDER_CONFIRMED',
            title: 'New order received',
            message: 'Order MHH-222 received',
            link: '/orders',
            metadata: { orderId: 'order-2', orderNumber: 'MHH-222' },
        });

        expect(result.emailSent).toBe(true);
        expect(mockSendOrderStatusUpdateEmail).toHaveBeenCalledTimes(1);
        expect(mockSendNotificationEmail).not.toHaveBeenCalled();
    });

    it('uses the branded notification template for non-order notifications', async () => {
        const result = await dispatchNotification({
            userId: 'user-1',
            type: 'PAYMENT_SUCCESS',
            title: 'Wallet Deposit Successful',
            message: 'Your wallet has been credited with ₦5,000.',
            link: '/wallet',
            emailSubject: 'Wallet deposit confirmed',
            metadata: { amount: 5000, reference: 'PAY-123', gateway: 'paystack' },
        });

        expect(result.emailSent).toBe(true);
        expect(mockSendNotificationEmail).toHaveBeenCalledTimes(1);
        expect(mockSendNotificationEmail.mock.calls[0][1]).toMatchObject({
            title: 'Wallet Deposit Successful',
            message: 'Your wallet has been credited with ₦5,000.',
            link: 'https://harvesthub.ng/wallet',
            emailSubject: 'Wallet deposit confirmed',
            type: 'PAYMENT_SUCCESS',
        });
    });
});
