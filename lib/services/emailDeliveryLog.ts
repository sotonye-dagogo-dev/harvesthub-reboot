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

const emailDeliveryLogStore: EmailDeliveryLogEntry[] = [];

function createId(): string {
  return `email-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmailDeliveryLog(data: {
  to: string;
  subject: string;
  maxAttempts: number;
}): EmailDeliveryLogEntry {
  const entry: EmailDeliveryLogEntry = {
    id: createId(),
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
  emailDeliveryLogStore.push(entry);
  return entry;
}

export function updateEmailDeliveryLog(
  id: string,
  data: Partial<Omit<EmailDeliveryLogEntry, 'id' | 'createdAt' | 'updatedAt'>>
): EmailDeliveryLogEntry | null {
  const index = emailDeliveryLogStore.findIndex((entry) => entry.id === id);
  if (index === -1) return null;
  const current = emailDeliveryLogStore[index];
  if (!current) return null;
  const updated: EmailDeliveryLogEntry = {
    ...current,
    ...data,
    updatedAt: new Date(),
  };
  emailDeliveryLogStore[index] = updated;
  return updated;
}
