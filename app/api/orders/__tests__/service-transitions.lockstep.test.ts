import { describe, expect, it } from 'vitest';
import { OrderStatus } from '@/lib/constants';
import { ORDER_STATUS_TRANSITIONS } from '@/lib/config/orderTransitions';

/**
 * The transition graph lives in one module (`lib/config/orderTransitions.ts`)
 * and is aliased by both the status API and the operations orders page, so the
 * two can no longer drift. These tests guard the graph itself.
 */
describe('order transition graph', () => {
    it('wires the three service statuses exactly as designed', () => {
        expect(ORDER_STATUS_TRANSITIONS[OrderStatus.AWAITING_REQUIREMENTS]).toContain(OrderStatus.IN_PROGRESS);
        expect(ORDER_STATUS_TRANSITIONS[OrderStatus.IN_PROGRESS]).toContain(OrderStatus.IN_REVIEW);
        expect(ORDER_STATUS_TRANSITIONS[OrderStatus.IN_REVIEW]).toEqual(
            expect.arrayContaining([OrderStatus.DELIVERED, OrderStatus.IN_PROGRESS]),
        );
    });

    it('keeps a single path into and out of the requirements gate', () => {
        const intoGate = Object.entries(ORDER_STATUS_TRANSITIONS)
            .filter(([, targets]) => targets.includes(OrderStatus.AWAITING_REQUIREMENTS))
            .map(([status]) => status);
        expect(intoGate).toEqual([]);
        expect(ORDER_STATUS_TRANSITIONS[OrderStatus.AWAITING_REQUIREMENTS]).toEqual([
            OrderStatus.IN_PROGRESS,
            OrderStatus.CANCELLED,
        ]);
    });

    it('leaves the product lifecycle untouched', () => {
        expect(ORDER_STATUS_TRANSITIONS[OrderStatus.PENDING]).toEqual([
            OrderStatus.CONFIRMED,
            OrderStatus.CANCELLED,
        ]);
        expect(ORDER_STATUS_TRANSITIONS[OrderStatus.CONFIRMED]).toEqual([
            OrderStatus.PROCESSING,
            OrderStatus.CANCELLED,
        ]);
        expect(ORDER_STATUS_TRANSITIONS[OrderStatus.DELIVERED]).toEqual([]);
        expect(ORDER_STATUS_TRANSITIONS[OrderStatus.CANCELLED]).toEqual([]);
        expect(ORDER_STATUS_TRANSITIONS[OrderStatus.REFUNDED]).toEqual([]);
    });

    it('covers every status exactly once', () => {
        expect(Object.keys(ORDER_STATUS_TRANSITIONS).sort()).toEqual(
            Object.values(OrderStatus).map((status) => String(status)).sort(),
        );
    });
});
