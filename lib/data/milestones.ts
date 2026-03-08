/**
 * Milestone Store (In-Memory)
 *
 * In-memory storage for user milestone achievements.
 * TODO: Replace with Prisma model for persistence.
 */

import type { MilestoneRecord, MilestoneType } from '@/lib/types';

const milestones: MilestoneRecord[] = [];

function generateId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `milestone-${timestamp}-${random}`;
}

export const milestoneDb = {
    findAll: (filters?: { milestoneType?: MilestoneType; userId?: string }): MilestoneRecord[] => {
        let result = [...milestones];
        if (filters?.milestoneType) {
            result = result.filter((m) => m.milestoneType === filters.milestoneType);
        }
        if (filters?.userId) {
            result = result.filter((m) => m.userId === filters.userId);
        }
        return result.sort(
            (a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
        );
    },

    findById: (id: string): MilestoneRecord | undefined => {
        return milestones.find((m) => m.id === id);
    },

    findByUserId: (userId: string): MilestoneRecord[] => {
        return milestones
            .filter((m) => m.userId === userId)
            .sort(
                (a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
            );
    },

    findByType: (milestoneType: MilestoneType): MilestoneRecord[] => {
        return milestones
            .filter((m) => m.milestoneType === milestoneType)
            .sort(
                (a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
            );
    },

    findByUserAndType: (
        userId: string,
        milestoneType: MilestoneType
    ): MilestoneRecord | undefined => {
        return milestones.find(
            (m) => m.userId === userId && m.milestoneType === milestoneType
        );
    },

    create: (data: {
        userId: string;
        milestoneType: MilestoneType;
        label: string;
        metadata?: Record<string, unknown>;
    }): MilestoneRecord => {
        const newMilestone: MilestoneRecord = {
            id: generateId(),
            userId: data.userId,
            milestoneType: data.milestoneType,
            label: data.label,
            achievedAt: new Date().toISOString(),
            metadata: data.metadata,
        };
        milestones.push(newMilestone);
        return newMilestone;
    },

    update: (id: string, data: Partial<MilestoneRecord>): MilestoneRecord | null => {
        const index = milestones.findIndex((m) => m.id === id);
        if (index === -1) return null;
        const updated = { ...milestones[index], ...data } as MilestoneRecord;
        milestones[index] = updated;
        return updated;
    },

    delete: (id: string): boolean => {
        const index = milestones.findIndex((m) => m.id === id);
        if (index === -1) return false;
        milestones.splice(index, 1);
        return true;
    },

    count: (filters?: { milestoneType?: MilestoneType; userId?: string }): number => {
        return milestoneDb.findAll(filters).length;
    },
};
