/**
 * Voucher Store (In-Memory)
 *
 * In-memory storage for vouchers and redemption records.
 * TODO: Replace with Prisma model for persistence.
 */

export interface VoucherRecord {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_DELIVERY';
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  applicableCategories: string[];
  applicableVendors: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherRedemptionRecord {
  id: string;
  voucherId: string;
  userId: string;
  orderId?: string;
  discountApplied: number;
  redeemedAt: string;
}

const voucherStore: VoucherRecord[] = [];
const redemptionStore: VoucherRedemptionRecord[] = [];

function generateVoucherId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `voucher-${timestamp}-${random}`;
}

function generateRedemptionId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `redeem-${timestamp}-${random}`;
}

function generateVoucherCode(prefix?: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix ? `${prefix}-${code}` : code;
}

export const voucherDb = {
  findAll: (filters?: {
    isActive?: boolean;
    type?: VoucherRecord['type'];
  }): VoucherRecord[] => {
    let result = [...voucherStore];
    if (filters?.isActive !== undefined) {
      result = result.filter((v) => v.isActive === filters.isActive);
    }
    if (filters?.type) {
      result = result.filter((v) => v.type === filters.type);
    }
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  findById: (id: string): VoucherRecord | undefined => {
    return voucherStore.find((v) => v.id === id);
  },

  findByCode: (code: string): VoucherRecord | undefined => {
    return voucherStore.find((v) => v.code.toUpperCase() === code.toUpperCase());
  },

  create: (data: Omit<VoucherRecord, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>): VoucherRecord => {
    const now = new Date().toISOString();
    const record: VoucherRecord = {
      id: generateVoucherId(),
      ...data,
      usedCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    voucherStore.push(record);
    return record;
  },

  bulkCreate: (
    data: Omit<VoucherRecord, 'id' | 'code' | 'usedCount' | 'createdAt' | 'updatedAt'>,
    count: number,
    prefix: string,
  ): VoucherRecord[] => {
    const created: VoucherRecord[] = [];
    const now = new Date().toISOString();
    for (let i = 0; i < count; i++) {
      const record: VoucherRecord = {
        id: generateVoucherId(),
        ...data,
        code: generateVoucherCode(prefix),
        usedCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      voucherStore.push(record);
      created.push(record);
    }
    return created;
  },

  update: (id: string, data: Partial<VoucherRecord>): VoucherRecord | null => {
    const index = voucherStore.findIndex((v) => v.id === id);
    if (index === -1) return null;
    const updated: VoucherRecord = {
      ...voucherStore[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    voucherStore[index] = updated;
    return updated;
  },

  incrementUsedCount: (id: string): VoucherRecord | null => {
    const index = voucherStore.findIndex((v) => v.id === id);
    if (index === -1) return null;
    const updated: VoucherRecord = {
      ...voucherStore[index],
      usedCount: voucherStore[index].usedCount + 1,
      updatedAt: new Date().toISOString(),
    };
    voucherStore[index] = updated;
    return updated;
  },
};

export const redemptionDb = {
  findAll: (filters?: {
    voucherId?: string;
    userId?: string;
  }): VoucherRedemptionRecord[] => {
    let result = [...redemptionStore];
    if (filters?.voucherId) {
      result = result.filter((r) => r.voucherId === filters.voucherId);
    }
    if (filters?.userId) {
      result = result.filter((r) => r.userId === filters.userId);
    }
    return result.sort(
      (a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
    );
  },

  findByVoucherAndUser: (voucherId: string, userId: string): VoucherRedemptionRecord[] => {
    return redemptionStore.filter(
      (r) => r.voucherId === voucherId && r.userId === userId
    );
  },

  create: (data: Omit<VoucherRedemptionRecord, 'id' | 'redeemedAt'>): VoucherRedemptionRecord => {
    const record: VoucherRedemptionRecord = {
      id: generateRedemptionId(),
      ...data,
      redeemedAt: new Date().toISOString(),
    };
    redemptionStore.push(record);
    return record;
  },
};
