/**
 * Ad Store (In-Memory)
 *
 * In-memory storage for self-serve ad placements.
 * TODO: Replace with Prisma model for persistence.
 */

import type { Ad, AdStatus } from '@/lib/types';

const ads: Ad[] = [];

function generateId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ad-${timestamp}-${random}`;
}

export const adDb = {
    findAll: (filters?: {
        status?: AdStatus;
        userId?: string;
    }): Ad[] => {
        let result = [...ads];
        if (filters?.status) {
            result = result.filter((a) => a.status === filters.status);
        }
        if (filters?.userId) {
            result = result.filter((a) => a.userId === filters.userId);
        }
        return result.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    },

    findById: (id: string): Ad | undefined => {
        return ads.find((a) => a.id === id);
    },

    findByUserId: (userId: string): Ad[] => {
        return ads
            .filter((a) => a.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    findActive: (): Ad[] => {
        const now = new Date();
        return ads.filter(
            (a) =>
                a.status === 'ACTIVE' &&
                a.paymentVerified &&
                new Date(a.startDate) <= now &&
                new Date(a.endDate) >= now
        );
    },

    create: (data: {
        userId: string;
        title: string;
        subtitle?: string | null;
        ctaText?: string | null;
        ctaLink?: string | null;
        imageUrl: string;
        imagePublicId?: string | null;
        dailyRate: number;
        startDate: Date;
        duration: number;
    }): Ad => {
        const now = new Date();
        const endDate = new Date(data.startDate);
        endDate.setDate(endDate.getDate() + data.duration);

        const newAd: Ad = {
            id: generateId(),
            userId: data.userId,
            title: data.title,
            subtitle: data.subtitle ?? null,
            ctaText: data.ctaText ?? null,
            ctaLink: data.ctaLink ?? null,
            imageUrl: data.imageUrl,
            imagePublicId: data.imagePublicId ?? null,
            dailyRate: data.dailyRate,
            totalCost: data.dailyRate * data.duration,
            startDate: data.startDate,
            endDate,
            duration: data.duration,
            status: 'PENDING_PAYMENT',
            rejectionReason: null,
            paymentVerified: false,
            impressions: 0,
            clicks: 0,
            createdAt: now,
            updatedAt: now,
        };
        ads.push(newAd);
        return newAd;
    },

    update: (id: string, data: Partial<Ad>): Ad | null => {
        const index = ads.findIndex((a) => a.id === id);
        if (index === -1) return null;

        const updated = { ...ads[index], ...data, updatedAt: new Date() } as Ad;
        ads[index] = updated;
        return updated;
    },
};
