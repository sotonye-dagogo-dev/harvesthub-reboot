import { describe, expect, it } from 'vitest';
import { NotificationType as PrismaNotificationType } from '@/prisma/generated/client';
import { NotificationType as ConstantsNotificationType } from '@/lib/constants';
import { NOTIFICATION_TEMPLATE_CONFIG } from '@/lib/config/notificationTemplates';
import { DEFAULT_EMAIL_TEMPLATES, renderTemplateString } from '@/lib/config/emailTemplates';

const SUBSCRIPTION_TYPES = [
    'SUBSCRIPTION_ACTIVATED',
    'SUBSCRIPTION_EXPIRING_SOON',
    'SUBSCRIPTION_EXPIRED',
] as const;

function prismaEnumValues(): string[] {
    return Object.values(PrismaNotificationType as unknown as Record<string, string>);
}

describe('notification template parity (Session 104 — subscription types)', () => {
    it('mirrors every Prisma NotificationType in lib/constants', () => {
        const constantsValues = new Set(
            Object.values(ConstantsNotificationType as unknown as Record<string, string>)
        );
        for (const value of prismaEnumValues()) {
            expect(constantsValues.has(value), `constants mirror missing ${value}`).toBe(true);
        }
    });

    it('keeps the constants mirror free of stale values', () => {
        const prismaValues = new Set(prismaEnumValues());
        for (const value of Object.values(ConstantsNotificationType as unknown as Record<string, string>)) {
            expect(prismaValues.has(value), `constants mirror has stale ${value}`).toBe(true);
        }
    });

    it('has a NOTIFICATION_TEMPLATE_CONFIG entry for every Prisma NotificationType', () => {
        for (const value of prismaEnumValues()) {
            expect(
                NOTIFICATION_TEMPLATE_CONFIG[value as keyof typeof NOTIFICATION_TEMPLATE_CONFIG],
                `template config missing ${value}`
            ).toBeDefined();
        }
    });

    it('registers the three subscription notification types in both template registries', () => {
        for (const type of SUBSCRIPTION_TYPES) {
            expect(prismaEnumValues()).toContain(type);
            const notif =
                NOTIFICATION_TEMPLATE_CONFIG[type as keyof typeof NOTIFICATION_TEMPLATE_CONFIG];
            expect(notif).toBeDefined();
            if (!notif) continue;
            expect(notif.title.length).toBeGreaterThan(0);
            expect(notif.body.length).toBeGreaterThan(0);
            expect(notif.defaultLink?.startsWith('/')).toBe(true);

            const email = DEFAULT_EMAIL_TEMPLATES[type];
            expect(email, `email template registry missing ${type}`).toBeDefined();
            if (!email) continue;
            expect(email.key).toBe(type);
            expect(email.defaultSubject.length).toBeGreaterThan(0);
            expect(email.variables).toContain('firstName');
        }
    });

    it('renders subscription template variables via renderTemplateString', () => {
        const body =
            DEFAULT_EMAIL_TEMPLATES['SUBSCRIPTION_ACTIVATED']?.defaultBody ?? '';
        const rendered = renderTemplateString(body, {
            firstName: 'Ada',
            packageName: 'Growth',
            expiresAt: 'Nov 21, 2026',
            link: 'https://example.test/operations/subscription',
        });
        expect(rendered).toContain('Ada');
        expect(rendered).toContain('Growth');
        expect(rendered).toContain('Nov 21, 2026');
        expect(rendered).not.toContain('{{');
    });
});
