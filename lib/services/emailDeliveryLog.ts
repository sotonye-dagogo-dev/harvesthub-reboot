import { prisma } from '@/lib/db/prisma';

export type EmailDeliveryStatus = 'PENDING' | 'RETRYING' | 'FAILED' | 'SENT';

export interface EmailDeliveryLogEntry {
  id: string;
  to: string;
  subject: string;
  status: EmailDeliveryStatus;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Date | null;
  lastError: string | null;
  providerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const memoryFallbackStore: EmailDeliveryLogEntry[] = [];

function createFallbackEntry(data: { to: string; subject: string; maxAttempts: number }): EmailDeliveryLogEntry {
  const entry: EmailDeliveryLogEntry = {
    id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    to: data.to,
    subject: data.subject,
    status: 'PENDING',
    attempts: 0,
    maxAttempts: data.maxAttempts,
    nextRetryAt: null,
    lastError: null,
    providerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryFallbackStore.push(entry);
  return entry;
}

type EmailDeliveryLogModel = {
  create: (args: { data: { to: string; subject: string; maxAttempts: number } }) => Promise<any>;
  update: (args: { where: { id: string }; data: Partial<EmailDeliveryLogEntry> }) => Promise<any>;
};

export async function createEmailDeliveryLog(data: {
  to: string;
  subject: string;
  maxAttempts: number;
}): Promise<EmailDeliveryLogEntry> {
  try {
    const model = (prisma as unknown as { emailDeliveryLog?: EmailDeliveryLogModel }).emailDeliveryLog;
    if (!model?.create) {
      throw new Error('EmailDeliveryLog model not available on Prisma client');
    }

    const created = await model.create({
      data: {
        to: data.to,
        subject: data.subject,
        maxAttempts: data.maxAttempts,
      },
    });
    return {
      ...created,
      status: created.status as EmailDeliveryStatus,
    };
  } catch {
    return createFallbackEntry(data);
  }
}

export async function updateEmailDeliveryLog(
  id: string,
  data: Partial<Omit<EmailDeliveryLogEntry, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<EmailDeliveryLogEntry | null> {
  try {
    const model = (prisma as unknown as { emailDeliveryLog?: EmailDeliveryLogModel }).emailDeliveryLog;
    if (!model?.update) {
      throw new Error('EmailDeliveryLog model not available on Prisma client');
    }

    const updated = await model.update({
      where: { id },
      data: {
        status: data.status,
        attempts: data.attempts,
        maxAttempts: data.maxAttempts,
        nextRetryAt: data.nextRetryAt,
        lastError: data.lastError,
        providerId: data.providerId,
      },
    });
    return {
      ...updated,
      status: updated.status as EmailDeliveryStatus,
    };
  } catch {
    const index = memoryFallbackStore.findIndex((entry) => entry.id === id);
    if (index === -1) return null;
    const current = memoryFallbackStore[index];
    if (!current) return null;
    const updated: EmailDeliveryLogEntry = {
      ...current,
      ...data,
      updatedAt: new Date(),
    };
    memoryFallbackStore[index] = updated;
    return updated;
  }
}
