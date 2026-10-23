import { describe, expect, it } from 'vitest';
import {
    computeServiceDeadline,
    consumeRevisionBudget,
    getServiceDeliveryDays,
    hasRevisionBudget,
    initialOrderStatus,
    isDeadlinePast,
    isServiceItem,
    orderHasServiceItems,
    orderIsServiceOnly,
    readServiceConfig,
    rearmDeadline,
    serviceKind,
    shouldPromoteToRequirementsGate,
} from '@/lib/services/serviceOrders';

const product = { listingType: 'PRODUCT' };
const service = { listingType: 'SERVICE', serviceConfig: { tier: 'BASIC', deliveryDays: 5, revisions: 2 } };

describe('serviceKind (single-status decision)', () => {
    it('treats an all-service item set as a service order', () => {
        expect(orderIsServiceOnly([service, service])).toBe(true);
        expect(serviceKind([service, service])).toBe('SERVICE');
        expect(orderHasServiceItems([service])).toBe(true);
    });

    it('keeps mixed carts on the product path', () => {
        expect(orderIsServiceOnly([service, product])).toBe(false);
        expect(serviceKind([service, product])).toBe('MIXED');
        expect(serviceKind([product])).toBe('PRODUCT');
        expect(serviceKind([])).toBe('PRODUCT');
    });

    it('identifies service items by listingType', () => {
        expect(isServiceItem(service)).toBe(true);
        expect(isServiceItem(product)).toBe(false);
        expect(isServiceItem({ listingType: null })).toBe(false);
    });
});

describe('deadline math', () => {
    it('adds whole days from the purchase moment', () => {
        const from = new Date('2026-01-01T00:00:00.000Z');
        expect(computeServiceDeadline(from, 3).toISOString()).toBe('2026-01-04T00:00:00.000Z');
    });

    it('clamps an invalid delivery window to one day', () => {
        const from = new Date('2026-01-01T00:00:00.000Z');
        expect(computeServiceDeadline(from, 0).toISOString()).toBe('2026-01-02T00:00:00.000Z');
        expect(getServiceDeliveryDays({ deliveryDays: Number.NaN })).toBe(1);
        expect(getServiceDeliveryDays(null)).toBe(1);
        expect(getServiceDeliveryDays({ deliveryDays: 7 })).toBe(7);
    });

    it('detects a past deadline idempotently', () => {
        const now = new Date('2026-01-10T00:00:00.000Z');
        expect(isDeadlinePast('2026-01-09T00:00:00.000Z', now)).toBe(true);
        expect(isDeadlinePast('2026-01-11T00:00:00.000Z', now)).toBe(false);
        expect(isDeadlinePast(null, now)).toBe(false);
        expect(isDeadlinePast('not-a-date', now)).toBe(false);
    });

    it('re-arms the clock from the revision moment (TC-003)', () => {
        const now = new Date('2026-02-01T12:00:00.000Z');
        expect(rearmDeadline(4, now).getTime()).toBe(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    });
});

describe('revision budget', () => {
    it('decrements a numeric budget', () => {
        expect(consumeRevisionBudget(2)).toBe(1);
        expect(consumeRevisionBudget(1)).toBe(0);
        expect(consumeRevisionBudget(0)).toBe(0);
        expect(hasRevisionBudget(1)).toBe(true);
        expect(hasRevisionBudget(0)).toBe(false);
    });

    it('treats a legacy null budget as unlimited (never locks the order out)', () => {
        expect(consumeRevisionBudget(null)).toBeNull();
        expect(consumeRevisionBudget(undefined)).toBeNull();
        expect(hasRevisionBudget(null)).toBe(true);
    });
});

describe('requirements gate seeding', () => {
    it('seeds AWAITING_REQUIREMENTS only for paid service-only orders', () => {
        expect(initialOrderStatus({ isServiceOnly: true, paymentStatus: 'PAID' })).toBe('AWAITING_REQUIREMENTS');
        expect(initialOrderStatus({ isServiceOnly: true, paymentStatus: 'PENDING' })).toBe('PENDING');
        expect(initialOrderStatus({ isServiceOnly: false, paymentStatus: 'PAID' })).toBe('PENDING');
    });

    it('promotes paid orders that were still pending at payment time', () => {
        expect(shouldPromoteToRequirementsGate({ status: 'PENDING', paymentStatus: 'PAID' })).toBe(true);
        expect(shouldPromoteToRequirementsGate({ status: 'PENDING', paymentStatus: 'PENDING' })).toBe(false);
        expect(shouldPromoteToRequirementsGate({ status: 'IN_PROGRESS', paymentStatus: 'PAID' })).toBe(false);
    });
});

describe('service config snapshot', () => {
    it('reads the purchased tier snapshot off the item', () => {
        expect(readServiceConfig(service)).toMatchObject({ tier: 'BASIC', deliveryDays: 5 });
        expect(readServiceConfig({ listingType: 'SERVICE' })).toBeNull();
        expect(readServiceConfig(null)).toBeNull();
        expect(readServiceConfig({ serviceConfig: [] })).toBeNull();
    });
});
