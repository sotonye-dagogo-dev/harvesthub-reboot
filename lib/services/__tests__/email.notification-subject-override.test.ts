import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockCreateLog, mockUpdateLog, mockProviderSend } = vi.hoisted(() => ({
    mockPrisma: {
        emailTemplate: { findUnique: vi.fn() },
    },
    mockCreateLog: vi.fn().mockResolvedValue({ id: 'log-1', attempts: 0 }),
    mockUpdateLog: vi.fn().mockResolvedValue(undefined),
    mockProviderSend: vi.fn().mockResolvedValue({ data: { id: 'msg-1' }, error: null }),
}));

vi.mock('@/lib/db/prisma', () => ({
    prisma: mockPrisma,
}));

vi.mock('@/lib/config', () => ({
    env: {
        resendApiKey: 'test-key',
        emailFrom: 'noreply@test.dev',
        emailRetryAttempts: 1,
        emailRetryBaseDelayMs: 0,
    },
    featureFlags: {
        enableEmail: true,
        enablePushNotifications: false,
    },
}));

vi.mock('@/lib/services/emailDeliveryLog', () => ({
    createEmailDeliveryLog: (...args: unknown[]) => mockCreateLog(...args),
    updateEmailDeliveryLog: (...args: unknown[]) => mockUpdateLog(...args),
}));

vi.mock('resend', () => ({
    Resend: class {
        emails = { send: (...args: unknown[]) => mockProviderSend(...args) };
    },
}));

vi.mock('@/lib/emails/NotificationEmail', () => ({
    NotificationEmail: () => null,
}));

import { resolveNotificationEmailSubject, sendNotificationEmail } from '@/lib/services/email';

const baseContext = {
    title: 'Delivery Ready for Review',
    message: 'Your order MHH-5001 is ready for review.',
    emailSubject: 'Delivery Ready for Review',
    firstName: 'Ada',
    link: 'https://harvesthub.ng/orders',
    type: 'SERVICE_DELIVERED',
    metadata: { orderNumber: 'MHH-5001', amount: 12000 },
};

describe('notification email subject override', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCreateLog.mockResolvedValue({ id: 'log-1', attempts: 0 });
        mockUpdateLog.mockResolvedValue(undefined);
        mockProviderSend.mockResolvedValue({ data: { id: 'msg-1' }, error: null });
    });

    it('uses the admin-edited EmailTemplate subject for the notification type', async () => {
        mockPrisma.emailTemplate.findUnique.mockResolvedValue({
            key: 'SERVICE_DELIVERED',
            subject: 'Review & release order {{orderNumber}}',
            body: 'unused',
        });

        const subject = await resolveNotificationEmailSubject(baseContext);

        expect(mockPrisma.emailTemplate.findUnique).toHaveBeenCalledWith({
            where: { key: 'SERVICE_DELIVERED' },
        });
        expect(subject).toBe('Review & release order MHH-5001');
    });

    it('falls back to the caller email subject when no admin override exists', async () => {
        mockPrisma.emailTemplate.findUnique.mockResolvedValue(null);

        const subject = await resolveNotificationEmailSubject(baseContext);

        expect(subject).toBe('Delivery Ready for Review');
    });

    it('does not look up a template when no notification type is provided', async () => {
        const subject = await resolveNotificationEmailSubject({
            title: 'Wallet Deposit Successful',
            message: 'Credited',
            emailSubject: 'Wallet deposit confirmed',
        });

        expect(subject).toBe('Wallet deposit confirmed');
        expect(mockPrisma.emailTemplate.findUnique).not.toHaveBeenCalled();
    });

    it('survives a template lookup failure without breaking the send', async () => {
        mockPrisma.emailTemplate.findUnique.mockRejectedValue(new Error('db down'));

        const subject = await resolveNotificationEmailSubject(baseContext);

        expect(subject).toBe('Delivery Ready for Review');
    });

    it('passes the resolved subject through sendNotificationEmail', async () => {
        mockPrisma.emailTemplate.findUnique.mockResolvedValue({
            key: 'SERVICE_DELIVERED',
            subject: 'Accept delivery for {{orderNumber}}',
            body: 'unused',
        });

        const result = await sendNotificationEmail('ada@example.com', {
            firstName: 'Ada',
            title: 'Delivery Ready for Review',
            message: 'Your order MHH-5001 is ready for review.',
            emailSubject: 'Delivery Ready for Review',
            link: 'https://harvesthub.ng/orders',
            linkLabel: 'Accept & Release',
            type: 'SERVICE_DELIVERED',
            metadata: { orderNumber: 'MHH-5001' },
        });

        expect(result.success).toBe(true);
        expect(mockCreateLog).toHaveBeenCalledTimes(1);
        expect(mockCreateLog.mock.calls[0]![0]).toMatchObject({
            to: 'ada@example.com',
            subject: 'Accept delivery for MHH-5001',
        });
    });
});
