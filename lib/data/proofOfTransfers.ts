/**
 * Proof of Transfer Store (In-Memory)
 *
 * In-memory storage for bank transfer proof-of-payment records.
 * TODO: Replace with Prisma model for persistence.
 */

export interface ProofOfTransferRecord {
  id: string;
  orderId?: string;
  userId: string;
  imageUrl: string;
  imagePublicId?: string;
  bankReference?: string;
  amount: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
}

const proofStore: ProofOfTransferRecord[] = [];

function generateId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `pot-${timestamp}-${random}`;
}

export const proofOfTransferDb = {
  getAll: (): ProofOfTransferRecord[] => {
    return [...proofStore].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getById: (id: string): ProofOfTransferRecord | undefined => {
    return proofStore.find((p) => p.id === id);
  },

  getByUserId: (userId: string): ProofOfTransferRecord[] => {
    return proofStore
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getByOrderId: (orderId: string): ProofOfTransferRecord[] => {
    return proofStore.filter((p) => p.orderId === orderId);
  },

  getByStatus: (status: ProofOfTransferRecord['status']): ProofOfTransferRecord[] => {
    return proofStore
      .filter((p) => p.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  create: (data: Omit<ProofOfTransferRecord, 'id' | 'createdAt'>): ProofOfTransferRecord => {
    const record: ProofOfTransferRecord = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    proofStore.push(record);
    return record;
  },

  update: (id: string, data: Partial<ProofOfTransferRecord>): ProofOfTransferRecord | null => {
    const index = proofStore.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const updated: ProofOfTransferRecord = { ...proofStore[index], ...data };
    proofStore[index] = updated;
    return updated;
  },
};
