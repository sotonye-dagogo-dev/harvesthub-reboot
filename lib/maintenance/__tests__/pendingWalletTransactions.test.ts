import { describe, expect, it, vi } from 'vitest';
import {
    isStuckPendingPaystackDeposit,
    repairPendingWalletTransactions,
} from '../pendingWalletTransactions';

describe('pending wallet transaction repair helpers', () => {
    it('identifies legacy pending Paystack deposits', () => {
        expect(
            isStuckPendingPaystackDeposit({
                id: 'txn-1',
                type: 'DEPOSIT',
                status: 'PENDING',
                reference: 'PAY-1',
                description: 'Wallet deposit awaiting payment confirmation',
                metadata: {
                    gateway: 'PAYSTACK',
                    verificationStatus: 'GATEWAY_UNAVAILABLE',
                },
            })
        ).toBe(true);

        expect(
            isStuckPendingPaystackDeposit({
                id: 'txn-2',
                type: 'WITHDRAWAL',
                status: 'PENDING',
                reference: 'PAY-2',
                description: 'Wallet deposit awaiting payment confirmation',
                metadata: {
                    gateway: 'PAYSTACK',
                    verificationStatus: 'GATEWAY_UNAVAILABLE',
                },
            })
        ).toBe(false);
    });

    it('repairs stuck Paystack deposits when apply mode is enabled', async () => {
        const findManyMock = vi.fn().mockResolvedValue([
            {
                id: 'txn-1',
                type: 'DEPOSIT',
                status: 'PENDING',
                reference: 'PAY-1',
                description: 'Wallet deposit awaiting payment confirmation',
                metadata: {
                    gateway: 'PAYSTACK',
                    verificationStatus: 'GATEWAY_UNAVAILABLE',
                },
            },
            {
                id: 'txn-2',
                type: 'DEPOSIT',
                status: 'PENDING',
                reference: 'BANK-1',
                description: 'Bank transfer deposit',
                metadata: {
                    gateway: 'FLUTTERWAVE',
                },
            },
        ]);
        const updateMock = vi.fn().mockResolvedValue({});
        const logger = { info: vi.fn(), warn: vi.fn() };

        const summary = await repairPendingWalletTransactions({
            client: {
                transaction: {
                    findMany: findManyMock,
                    update: updateMock,
                },
            },
            dryRun: false,
            logger,
        });

        expect(summary).toEqual({
            inspected: 2,
            repaired: 1,
            skipped: 1,
            dryRun: false,
            references: ['PAY-1'],
        });
        expect(updateMock).toHaveBeenCalledTimes(1);
        expect(updateMock.mock.calls[0][0]).toMatchObject({
            where: { id: 'txn-1' },
            data: expect.objectContaining({
                status: 'FAILED',
                metadata: expect.objectContaining({
                    repairStatus: 'FAILED',
                }),
            }),
        });
        expect(logger.warn).toHaveBeenCalled();
    });
});