/**
 * Service-order domain helpers (task T5).
 *
 * Single-status decision (plan §serviceKind): an order is a SERVICE order only when
 * EVERY item is `listingType=SERVICE`. Mixed carts keep the product path untouched —
 * `serviceKind` is computed from the item set, never from a parallel order table.
 *
 * Pure and dependency-free so the transition/deadline tests stay fast.
 */

import type { ServicePackage } from '@/lib/types';

export type ServiceKind = 'SERVICE' | 'PRODUCT' | 'MIXED';

export interface ServiceOrderItemLike {
    listingType?: string | null;
    serviceConfig?: unknown;
    requirementAnswers?: unknown;
    requirementsSubmittedAt?: Date | string | null;
    deadlineAt?: Date | string | null;
    revisionsRemaining?: number | null;
}

/** A purchased service package snapshot: tier, price, delivery window, revisions, extras. */
export interface ServiceConfigSnapshot extends Partial<ServicePackage> {
    requirementFields?: unknown[];
}

export const isServiceItem = (item: ServiceOrderItemLike | null | undefined): boolean =>
    item?.listingType === 'SERVICE';

export const orderHasServiceItems = (items: ServiceOrderItemLike[]): boolean =>
    items.some(isServiceItem);

/** True when every item is a service (single-status decision documented in the plan). */
export const orderIsServiceOnly = (items: ServiceOrderItemLike[]): boolean =>
    items.length > 0 && items.every(isServiceItem);

export const serviceKind = (items: ServiceOrderItemLike[]): ServiceKind => {
    if (items.length === 0) return 'PRODUCT';
    const serviceCount = items.filter(isServiceItem).length;
    if (serviceCount === items.length) return 'SERVICE';
    if (serviceCount === 0) return 'PRODUCT';
    return 'MIXED';
};

export function readServiceConfig(item: ServiceOrderItemLike | null | undefined): ServiceConfigSnapshot | null {
    const raw = item?.serviceConfig;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    return raw as ServiceConfigSnapshot;
}

/** Delivery window in whole days; legacy rows without a snapshot default to 1 day. */
export const getServiceDeliveryDays = (config: ServiceConfigSnapshot | null | undefined): number => {
    const days = Number(config?.deliveryDays ?? 1);
    if (!Number.isFinite(days) || days < 1) return 1;
    return Math.floor(days);
};

export const computeServiceDeadline = (from: Date, deliveryDays: number): Date =>
    new Date(from.getTime() + Math.max(1, Math.floor(deliveryDays)) * 24 * 60 * 60 * 1000);

/** Idempotent late detection — pure comparison, safe to call repeatedly. */
export const isDeadlinePast = (deadline: Date | string | null | undefined, now: Date = new Date()): boolean => {
    if (!deadline) return false;
    const time = deadline instanceof Date ? deadline.getTime() : new Date(deadline).getTime();
    if (Number.isNaN(time)) return false;
    return time < now.getTime();
};

/** PRD TC-003: a revision re-arms the fulfilment clock from the moment it is granted. */
export const rearmDeadline = (deliveryDays: number, now: Date = new Date()): Date =>
    computeServiceDeadline(now, deliveryDays);

/**
 * Returns the remaining budget after a revision.
 * `null` means "unlimited / legacy row" and stays unlimited (TC-003 never locks out
 * orders created before the column existed).
 * `0` means exhausted — callers must reject the revision.
 */
export const consumeRevisionBudget = (revisionsRemaining: number | null | undefined): number | null => {
    if (revisionsRemaining === null || revisionsRemaining === undefined) return null;
    const current = Number(revisionsRemaining);
    if (!Number.isFinite(current) || current <= 0) return 0;
    return Math.floor(current) - 1;
};

export const hasRevisionBudget = (revisionsRemaining: number | null | undefined): boolean =>
    revisionsRemaining === null || revisionsRemaining === undefined || Number(revisionsRemaining) > 0;

/**
 * Initial status for a newly created order.
 * Paid + service-only → straight into the requirements gate; everything else keeps
 * today's `PENDING` behaviour byte-for-byte.
 */
export const initialOrderStatus = (opts: {
    isServiceOnly: boolean;
    paymentStatus: string;
}): 'PENDING' | 'AWAITING_REQUIREMENTS' =>
    opts.isServiceOnly && opts.paymentStatus === 'PAID' ? 'AWAITING_REQUIREMENTS' : 'PENDING';

/** Paid service orders that were still PENDING when payment settled later. */
export const shouldPromoteToRequirementsGate = (order: {
    status: string;
    paymentStatus: string;
}): boolean => order.status === 'PENDING' && order.paymentStatus === 'PAID';
