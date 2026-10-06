import { describe, expect, it, vi } from 'vitest';
import {
    OrderStatus,
    PaymentStatus,
    TransactionStatus,
    TransactionType,
} from '@/prisma/generated/client';
import { CATEGORY_COMMISSION_DEFAULTS, VendorCategory } from '@/lib/constants';
import {
    getCommissionReference,
    releaseOrderSettlement,
} from '@/lib/services/orderLifecycle';

type TxOptions = {
    commissionEnabled?: boolean;
    commissionRate?: number | null;
    payoutStatus?: TransactionStatus;
    alreadyReleasedInHistory?: boolean;
    existingCommissionId?: string | null;
    balance?: number;
};

function createTx(options: TxOptions = {}) {
    const {
        commissionEnabled = false,
        commissionRate = 0.05,
        payoutStatus = TransactionStatus.PENDING,
        alreadyReleasedInHistory = false,
        existingCommissionId = null,
        balance = 5000,
    } = options;

    const history = [
        {
            status: 'DELIVERED',
            timestamp: new Date('2026-10-01T10:00:00Z').toISOString(),
            updatedBy: 'system',
        },
        ...(alreadyReleasedInHistory
            ? [
                {
                    status: 'SETTLEMENT_RELEASED',
                    timestamp: new Date('2026-10-01T11:00:00Z').toISOString(),
                    updatedBy: 'system',
                },
            ]
            : []),
    ];

    const order = {
        id: 'order-1',
        orderNumber: 'MHH-7001',
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.PAID,
        total: 10000,
        statusHistory: history,
        completedAt: null,
        vendorId: 'vendor-1',
        buyer: { userId: 'buyer-user-1' },
        vendor: { userId: 'vendor-user-1', commissionRate },
    };

    const payout = {
        id: 'payout-1',
        status: payoutStatus,
        walletId: 'wallet-1',
        metadata: {} as Record<string, unknown>,
        reference: 'PAYOUT-ORDER-order-1',
    };

    const tx = {
        order: {
            findUnique: vi.fn().mockResolvedValue(order),
            update: vi.fn().mockResolvedValue({}),
        },
        transaction: {
            findFirst: vi.fn().mockImplementation(async (args: any) => {
                if (args?.where?.type === TransactionType.COMMISSION) {
                    return existingCommissionId ? { id: existingCommissionId } : null;
                }
                if (args?.where?.reference) {
                    return payout;
                }
                return { id: payout.id, reference: payout.reference };
            }),
            update: vi.fn().mockResolvedValue({}),
            create: vi.fn().mockResolvedValue({}),
        },
        wallet: {
            findUnique: vi.fn().mockResolvedValue({ id: 'wallet-1', balance }),
            update: vi.fn().mockResolvedValue({}),
        },
        commerceLifecycleConfig: {
            findUnique: vi
                .fn()
                .mockResolvedValue({ serviceSettlementCommissionEnabled: commissionEnabled }),
        },
        vendor: {
            findUnique: vi.fn(),
        },
    };

    return tx;
}

const releaseParams = { orderId: 'order-1', updatedBy: 'admin-1', autoConfirmed: false };

describe('releaseOrderSettlement commission split', () => {
    it('keeps legacy behaviour byte-identical when the flag is off (default)', async () => {
        const tx = createTx({ commissionEnabled: false, commissionRate: 0.5, balance: 5000 });

        const result = await releaseOrderSettlement(tx as never, releaseParams);

        expect(result.state).toBe('released');
        expect(result.amount).toBe(10000);
        expect(result.commission).toBeUndefined();
        expect(result.net).toBeUndefined();

        expect(tx.wallet.update).toHaveBeenCalledTimes(1);
        expect(tx.wallet.update).toHaveBeenCalledWith({
            where: { id: 'wallet-1' },
            data: { balance: 15000 },
        });

        expect(tx.transaction.create).not.toHaveBeenCalled();

        expect(tx.transaction.update).toHaveBeenCalledTimes(1);
        const payoutUpdate = tx.transaction.update.mock.calls[0]![0] as any;
        expect(payoutUpdate.where).toEqual({ id: 'payout-1' });
        expect(payoutUpdate.data.status).toBe(TransactionStatus.COMPLETED);
        expect(payoutUpdate.data.balanceBefore).toBe(5000);
        expect(payoutUpdate.data.balanceAfter).toBe(15000);
        expect(payoutUpdate.data.description).toBe('Settlement released for order MHH-7001');
        expect(payoutUpdate.data.metadata.settlementStage).toBe('RELEASED');
        expect(payoutUpdate.data.metadata.releasedBy).toBe('admin-1');
    });

    it('credits the vendor net and writes a COMMISSION audit transaction when the flag is on', async () => {
        const tx = createTx({ commissionEnabled: true, commissionRate: 0.1, balance: 5000 });

        const result = await releaseOrderSettlement(tx as never, releaseParams);

        expect(result.state).toBe('released');
        expect(result.commission).toBe(1000);
        expect(result.net).toBe(9000);

        expect(tx.wallet.update).toHaveBeenCalledTimes(1);
        expect(tx.wallet.update).toHaveBeenCalledWith({
            where: { id: 'wallet-1' },
            data: { balance: 14000 },
        });

        const payoutUpdate = tx.transaction.update.mock.calls[0]![0] as any;
        expect(payoutUpdate.data.balanceBefore).toBe(5000);
        expect(payoutUpdate.data.balanceAfter).toBe(14000);

        expect(tx.transaction.create).toHaveBeenCalledTimes(1);
        const commissionCreate = tx.transaction.create.mock.calls[0]![0] as any;
        expect(commissionCreate.data).toMatchObject({
            walletId: 'wallet-1',
            type: TransactionType.COMMISSION,
            amount: 1000,
            balanceBefore: 14000,
            balanceAfter: 14000,
            status: TransactionStatus.COMPLETED,
            reference: getCommissionReference('order-1'),
            orderId: 'order-1',
            metadata: { rate: 0.1, gross: 10000, net: 9000 },
        });
    });

    it('falls back to CATEGORY_COMMISSION_DEFAULTS.SERVICES when the vendor rate is unusable', async () => {
        const tx = createTx({
            commissionEnabled: true,
            commissionRate: null,
            balance: 5000,
        });

        const result = await releaseOrderSettlement(tx as never, releaseParams);

        const expectedRate = CATEGORY_COMMISSION_DEFAULTS[VendorCategory.SERVICES];
        expect(expectedRate).toBe(0.05);
        expect(result.commission).toBe(500);
        expect(result.net).toBe(9500);

        const commissionCreate = tx.transaction.create.mock.calls[0]![0] as any;
        expect(commissionCreate.data.metadata.rate).toBe(expectedRate);
        expect(commissionCreate.data.metadata.gross).toBe(10000);
        expect(commissionCreate.data.metadata.net).toBe(9500);
        expect(tx.wallet.update.mock.calls[0]![0].data.balance).toBe(9500 + 5000);
    });

    it('does not double-credit when a COMMISSION transaction already exists', async () => {
        const tx = createTx({
            commissionEnabled: true,
            commissionRate: 0.1,
            existingCommissionId: 'txn-commission-1',
        });

        const result = await releaseOrderSettlement(tx as never, releaseParams);

        expect(result.state).toBe('released');
        expect(result.commission).toBe(1000);
        expect(tx.transaction.create).not.toHaveBeenCalled();
        expect(tx.wallet.update).toHaveBeenCalledTimes(1);
        expect(tx.wallet.update.mock.calls[0]![0].data.balance).toBe(14000);
    });

    it('is idempotent when the settlement was already released in history', async () => {
        const tx = createTx({
            commissionEnabled: true,
            commissionRate: 0.1,
            alreadyReleasedInHistory: true,
        });

        const result = await releaseOrderSettlement(tx as never, releaseParams);

        expect(result.state).toBe('already_released');
        expect(tx.wallet.update).not.toHaveBeenCalled();
        expect(tx.transaction.create).not.toHaveBeenCalled();
        expect(tx.transaction.update).not.toHaveBeenCalled();
    });

    it('is idempotent when the payout transaction is already COMPLETED', async () => {
        const tx = createTx({
            commissionEnabled: true,
            commissionRate: 0.1,
            payoutStatus: TransactionStatus.COMPLETED,
        });

        const result = await releaseOrderSettlement(tx as never, releaseParams);

        expect(result.state).toBe('already_released');
        expect(tx.wallet.update).not.toHaveBeenCalled();
        expect(tx.transaction.create).not.toHaveBeenCalled();
        expect(tx.order.update).toHaveBeenCalledTimes(1);
    });
});
