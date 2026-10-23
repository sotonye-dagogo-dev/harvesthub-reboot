import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    mockPrisma,
    mockSendNotificationEmail,
    mockSendOrderConfirmationEmail,
    mockSendOrderStatusUpdateEmail,
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

import { dispatchNotification } from '@/lib/services/notifications';

function setPreferences(overrides: Record<string, boolean> = {}) {
    mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        emailNotifications: true,
        pushNotifications: false,
        orderUpdates: true,
        promotions: true,
        vendorMessages: true,
        ...overrides,
    });
}

describe('dispatchNotification service email routing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.user.findUnique.mockResolvedValue({
            email: 'buyer@example.com',
            firstName: 'Ada',
            createdAt: new Date('2026-10-01T00:00:00Z'),
            role: 'BUYER',
        });
        setPreferences();
        mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1' });
        mockPrisma.pushSubscription.findMany.mockResolvedValue([]);
        mockPrisma.order.findUnique.mockResolvedValue(null);
        mockSendOrderConfirmationEmail.mockResolvedValue({ success: true });
        mockSendOrderStatusUpdateEmail.mockResolvedValue({ success: true });
        mockSendNotificationEmail.mockResolvedValue({ success: true });
    });

    it('routes SERVICE_DELIVERED through the generic notification email with the accept & release CTA', async () => {
        const result = await dispatchNotification({
            userId: 'user-1',
            type: 'SERVICE_DELIVERED',
            metadata: { orderId: 'order-9', orderNumber: 'MHH-9001', amount: 12000 },
        });

        expect(result.inAppCreated).toBe(true);
        expect(result.emailSent).toBe(true);
        expect(mockSendOrderConfirmationEmail).not.toHaveBeenCalled();
        expect(mockSendOrderStatusUpdateEmail).not.toHaveBeenCalled();
        expect(mockSendNotificationEmail).toHaveBeenCalledTimes(1);

        const emailArgs = mockSendNotificationEmail.mock.calls[0]![1] as Record<string, any>;
        expect(emailArgs.type).toBe('SERVICE_DELIVERED');
        expect(emailArgs.title).toBe('Delivery Ready for Review');
        expect(emailArgs.linkLabel).toBe('Accept & Release');
        expect(emailArgs.link).toBe('https://harvesthub.ng/orders');
        expect(emailArgs.emailSubject).toBe('Delivery Ready for Review');
        expect(emailArgs.metadata.orderNumber).toBe('MHH-9001');

        expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
        expect(mockPrisma.notification.create.mock.calls[0]![0].data).toMatchObject({
            type: 'SERVICE_DELIVERED',
            title: 'Delivery Ready for Review',
        });
    });

    it('gates every service notification behind the orderUpdates preference', async () => {
        setPreferences({ orderUpdates: false });

        const serviceTypes = [
            'SERVICE_REQUIREMENTS_REQUESTED',
            'SERVICE_REQUIREMENTS_SUBMITTED',
            'SERVICE_DELIVERED',
            'SERVICE_RELEASED',
            'SERVICE_REVISION_REQUESTED',
            'SERVICE_REQUIREMENTS_TIMEOUT',
        ] as const;

        for (const type of serviceTypes) {
            const result = await dispatchNotification({
                userId: 'user-1',
                type,
                metadata: { orderNumber: 'MHH-9002' },
            });

            expect(result.inAppCreated, type).toBe(false);
            expect(result.emailSent, type).toBe(false);
        }

        expect(mockPrisma.notification.create).not.toHaveBeenCalled();
        expect(mockSendNotificationEmail).not.toHaveBeenCalled();
    });

    it('delivers SERVICE_RELEASED to the seller with the net amount metadata', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            email: 'seller@example.com',
            firstName: 'Victor',
            createdAt: new Date('2026-10-01T00:00:00Z'),
            role: 'VENDOR',
        });

        const result = await dispatchNotification({
            userId: 'user-2',
            type: 'SERVICE_RELEASED',
            metadata: { orderNumber: 'MHH-9003', amount: 10000, commission: 500, net: 9500 },
        });

        expect(result.emailSent).toBe(true);
        const emailArgs = mockSendNotificationEmail.mock.calls[0]![1] as Record<string, any>;
        expect(emailArgs.type).toBe('SERVICE_RELEASED');
        expect(emailArgs.link).toBe('https://harvesthub.ng/wallet');
        expect(emailArgs.details).toEqual(
            expect.arrayContaining([
                { label: 'Amount', value: '₦10,000' },
                { label: 'Net payout', value: '₦9,500' },
                { label: 'Commission', value: '₦500' },
            ])
        );
    });

    it('still respects the email notification preference for service events', async () => {
        setPreferences({ emailNotifications: false });

        const result = await dispatchNotification({
            userId: 'user-1',
            type: 'SERVICE_REQUIREMENTS_REQUESTED',
            metadata: { orderNumber: 'MHH-9004' },
        });

        expect(result.inAppCreated).toBe(true);
        expect(result.emailSent).toBe(false);
        expect(mockSendNotificationEmail).not.toHaveBeenCalled();
    });
});
