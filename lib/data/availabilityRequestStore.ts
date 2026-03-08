/**
 * Availability Request Store (In-Memory)
 *
 * In-memory storage for availability requests between buyers and vendors.
 * TODO: Replace with Prisma model for persistence.
 */

import type { AvailabilityRequest, AvailabilityRequestItem, AvailabilityRequestStatus } from '@/lib/types';

const requests: AvailabilityRequest[] = [];

function generateId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `avail-${timestamp}-${random}`;
}

export const availabilityRequestDb = {
    findAll: (): AvailabilityRequest[] => [...requests],

    findById: (id: string): AvailabilityRequest | undefined => {
        return requests.find((r) => r.id === id);
    },

    findByBuyerId: (buyerId: string): AvailabilityRequest[] => {
        return requests.filter((r) => r.buyerId === buyerId);
    },

    findByVendorId: (vendorId: string): AvailabilityRequest[] => {
        return requests.filter((r) => r.vendorId === vendorId);
    },

    create: (data: {
        buyerId: string;
        vendorId: string;
        items: AvailabilityRequestItem[];
        buyerNote?: string | null;
    }): AvailabilityRequest => {
        const now = new Date();
        const newRequest: AvailabilityRequest = {
            id: generateId(),
            buyerId: data.buyerId,
            vendorId: data.vendorId,
            items: data.items,
            buyerNote: data.buyerNote ?? null,
            status: 'PENDING',
            vendorResponse: null,
            respondedAt: null,
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
            createdAt: now,
            updatedAt: now,
        };
        requests.push(newRequest);
        return newRequest;
    },

    update: (id: string, data: Partial<AvailabilityRequest>): AvailabilityRequest | null => {
        const index = requests.findIndex((r) => r.id === id);
        if (index === -1) return null;

        const updated = { ...requests[index], ...data, updatedAt: new Date() } as AvailabilityRequest;
        requests[index] = updated;
        return updated;
    },

    updateStatus: (
        id: string,
        status: AvailabilityRequestStatus,
        vendorResponse?: string,
    ): AvailabilityRequest | null => {
        const index = requests.findIndex((r) => r.id === id);
        if (index === -1) return null;

        const existing = requests[index];
        const now = new Date();
        const updated: AvailabilityRequest = {
            ...existing,
            status,
            vendorResponse: vendorResponse ?? existing.vendorResponse,
            respondedAt: status !== 'PENDING' ? now : existing.respondedAt,
            updatedAt: now,
        };
        requests[index] = updated;
        return updated;
    },
};
