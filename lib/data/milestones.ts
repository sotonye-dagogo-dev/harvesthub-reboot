/**
 * Milestone Store (Prisma)
 *
 * Persistence via the `UserMilestone` Prisma model.
 */

import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@/prisma/generated/client';
import type { MilestoneRecord, MilestoneType } from '@/lib/types';

export const milestoneDb = {
    findAll: async (filters?: { milestoneType?: MilestoneType; userId?: string }): Promise<MilestoneRecord[]> => {
        const where: any = {};
        if (filters?.milestoneType) where.milestoneType = filters.milestoneType;
        if (filters?.userId) where.userId = filters.userId;

        const records = await prisma.userMilestone.findMany({ where, orderBy: { achievedAt: 'desc' } });
        return records.map((r) => ({
            id: r.id,
            userId: r.userId,
            milestoneType: r.milestoneType as MilestoneType,
            label: r.label,
            achievedAt: r.achievedAt.toISOString(),
            metadata: r.metadata as Record<string, unknown> | undefined,
        }));
    },

    findById: async (id: string): Promise<MilestoneRecord | undefined> => {
        const r = await prisma.userMilestone.findUnique({ where: { id } });
        if (!r) return undefined;
        return {
            id: r.id,
            userId: r.userId,
            milestoneType: r.milestoneType as MilestoneType,
            label: r.label,
            achievedAt: r.achievedAt.toISOString(),
            metadata: r.metadata as Record<string, unknown> | undefined,
        };
    },

    findByUserId: async (userId: string): Promise<MilestoneRecord[]> => {
        return milestoneDb.findAll({ userId });
    },

    findByType: async (milestoneType: MilestoneType): Promise<MilestoneRecord[]> => {
        return milestoneDb.findAll({ milestoneType });
    },

    findByUserAndType: async (
        userId: string,
        milestoneType: MilestoneType
    ): Promise<MilestoneRecord | undefined> => {
        const r = await prisma.userMilestone.findFirst({
            where: { userId, milestoneType },
            orderBy: { achievedAt: 'desc' },
        });
        if (!r) return undefined;
        return {
            id: r.id,
            userId: r.userId,
            milestoneType: r.milestoneType as MilestoneType,
            label: r.label,
            achievedAt: r.achievedAt.toISOString(),
            metadata: r.metadata as Record<string, unknown> | undefined,
        };
    },

    create: async (data: {
        userId: string;
        milestoneType: MilestoneType;
        label: string;
        metadata?: Record<string, unknown>;
    }): Promise<MilestoneRecord> => {
        const r = await prisma.userMilestone.create({
            data: {
                userId: data.userId,
                milestoneType: data.milestoneType,
                label: data.label,
                metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
            },
        });
        return {
            id: r.id,
            userId: r.userId,
            milestoneType: r.milestoneType as MilestoneType,
            label: r.label,
            achievedAt: r.achievedAt.toISOString(),
            metadata: r.metadata as Record<string, unknown> | undefined,
        };
    },

    delete: async (id: string): Promise<boolean> => {
        await prisma.userMilestone.delete({ where: { id } });
        return true;
    },

    count: async (filters?: { milestoneType?: MilestoneType; userId?: string }): Promise<number> => {
        const where: any = {};
        if (filters?.milestoneType) where.milestoneType = filters.milestoneType;
        if (filters?.userId) where.userId = filters.userId;
        return prisma.userMilestone.count({ where });
    },
};
