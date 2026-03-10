/**
 * Bug Report Store (In-Memory)
 *
 * In-memory storage for user-submitted bug reports.
 * TODO: Replace with Prisma model for persistence.
 */

import type { BugReport, BugReportCategoryValue, BugReportPriorityValue, BugReportStatusValue } from '@/lib/types';

const bugReportStore: BugReport[] = [];

function generateId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `bug-${timestamp}-${random}`;
}

export const bugReportDb = {
  getAll: (filters?: {
    status?: BugReportStatusValue;
    category?: BugReportCategoryValue;
    priority?: BugReportPriorityValue;
  }): BugReport[] => {
    let results = [...bugReportStore];

    if (filters?.status) {
      results = results.filter((r) => r.status === filters.status);
    }
    if (filters?.category) {
      results = results.filter((r) => r.category === filters.category);
    }
    if (filters?.priority) {
      results = results.filter((r) => r.priority === filters.priority);
    }

    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getById: (id: string): BugReport | undefined => {
    return bugReportStore.find((r) => r.id === id);
  },

  getByUserId: (userId: string): BugReport[] => {
    return bugReportStore
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  create: (
    data: Omit<BugReport, 'id' | 'status' | 'adminNotes' | 'resolvedBy' | 'resolvedAt' | 'createdAt' | 'updatedAt'>
  ): BugReport => {
    const now = new Date().toISOString();
    const record: BugReport = {
      id: generateId(),
      ...data,
      status: 'OPEN',
      adminNotes: null,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    bugReportStore.push(record);
    return record;
  },

  update: (id: string, data: Partial<Pick<BugReport, 'status' | 'adminNotes' | 'resolvedBy' | 'resolvedAt'>>): BugReport | null => {
    const index = bugReportStore.findIndex((r) => r.id === id);
    if (index === -1) return null;
    const updated: BugReport = {
      ...bugReportStore[index]!,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    bugReportStore[index] = updated;
    return updated;
  },

  getStats: () => {
    return {
      total: bugReportStore.length,
      open: bugReportStore.filter((r) => r.status === 'OPEN').length,
      inProgress: bugReportStore.filter((r) => r.status === 'IN_PROGRESS').length,
      resolved: bugReportStore.filter((r) => r.status === 'RESOLVED').length,
      closed: bugReportStore.filter((r) => r.status === 'CLOSED').length,
    };
  },
};
