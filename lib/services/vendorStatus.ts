/**
 * Vendor status rules (single source of truth).
 *
 *  PENDING   – awaiting review. Can sell; listings show an "Unverified" badge.
 *  APPROVED  – verified. Can sell.
 *  SUSPENDED – blocked: store and listings hidden from buyers, cannot create or edit listings,
 *              new orders for their items are refused. Can still log in to see their status and
 *              finish orders already placed.
 *  REJECTED  – same restrictions as SUSPENDED.
 */

export const BLOCKED_VENDOR_STATUSES = ['SUSPENDED', 'REJECTED'] as const;
export type BlockedVendorStatus = (typeof BLOCKED_VENDOR_STATUSES)[number];

export function isVendorBlocked(status: string | null | undefined): boolean {
    return status === 'SUSPENDED' || status === 'REJECTED';
}

/** Prisma `where` fragment for a Product: only products whose vendor is visible to buyers. */
export function visibleVendorProductWhere(): { vendor: { status: { notIn: BlockedVendorStatus[] } } } {
    return { vendor: { status: { notIn: [...BLOCKED_VENDOR_STATUSES] } } };
}

/** Prisma `where` fragment for a Vendor: only vendors visible to buyers. */
export function visibleVendorWhere(): { status: { notIn: BlockedVendorStatus[] } } {
    return { status: { notIn: [...BLOCKED_VENDOR_STATUSES] } };
}

export const VENDOR_BLOCKED_CODE = 'VENDOR_NOT_ACTIVE';

export function vendorBlockedMessage(status: string | null | undefined): string {
    return status === 'REJECTED'
        ? 'Your vendor application was not approved, so you cannot publish or edit listings. Contact support if you think this is a mistake.'
        : 'Your store is suspended, so you cannot publish or edit listings. Contact support to restore it.';
}

/** Message for buyers when an item's vendor is no longer selling. */
export const VENDOR_UNAVAILABLE_FOR_BUYERS = 'This seller is not currently accepting orders.';
