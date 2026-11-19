import { describe, expect, it } from 'vitest';
import {
    APP_CURRENCY_DEFAULTS,
    AppCurrencyError,
    coinsRequiredFor,
    convertNairaToCoins,
    creditCoins,
    debitCoins,
    debitCoinsForOrder,
    nairaToCoins,
    normalizeAppCurrencyConfig,
    refundCoinsForOrder,
    type AppCurrencyConfig,
} from '@/lib/services/appCurrency';

type WalletRow = { id: string; userId: string; balance: number; coinBalance: number; isActive: boolean };
type Num = number | { gte?: number };

function matchesNumber(value: number, filter: Num | undefined) {
    if (filter === undefined) return true;
    if (typeof filter === 'number') return value === filter;
    return filter.gte === undefined || value >= filter.gte - 1e-9;
}

function applyNumber(value: number, op: unknown) {
    if (op === undefined) return value;
    if (typeof op === 'number') return op;
    const o = op as { increment?: number; decrement?: number };
    return value + (o.increment ?? 0) - (o.decrement ?? 0);
}

/** In-memory stand-in for the Prisma transaction client, honouring guarded updateMany semantics. */
function createFakeTx(wallets: WalletRow[]) {
    const coinTxs: Array<Record<string, any>> = [];
    const txs: Array<Record<string, any>> = [];
    const byWhere = (where: { id?: string; userId?: string }) =>
        wallets.find((w) => (where.id ? w.id === where.id : w.userId === where.userId));

    const tx = {
        wallet: {
            findUnique: async ({ where }: any) => byWhere(where) ?? null,
            findUniqueOrThrow: async ({ where }: any) => {
                const w = byWhere(where);
                if (!w) throw new Error('not found');
                return { ...w };
            },
            updateMany: async ({ where, data }: any) => {
                const w = wallets.find(
                    (row) =>
                        row.id === where.id &&
                        (where.isActive === undefined || row.isActive === where.isActive) &&
                        matchesNumber(row.balance, where.balance) &&
                        matchesNumber(row.coinBalance, where.coinBalance)
                );
                if (!w) return { count: 0 };
                w.balance = applyNumber(w.balance, data.balance);
                w.coinBalance = applyNumber(w.coinBalance, data.coinBalance);
                return { count: 1 };
            },
            upsert: async ({ where, update, create }: any) => {
                let w = byWhere(where);
                if (w) {
                    w.coinBalance = applyNumber(w.coinBalance, update.coinBalance);
                } else {
                    w = { id: `w-${wallets.length + 1}`, balance: 0, coinBalance: 0, isActive: true, ...create };
                    wallets.push(w as WalletRow);
                }
                return { ...(w as WalletRow) };
            },
        },
        coinTransaction: {
            findUnique: async ({ where }: any) => coinTxs.find((t) => t.reference === where.reference) ?? null,
            findFirst: async ({ where }: any) =>
                [...coinTxs].reverse().find((t) => t.orderId === where.orderId && t.type === where.type) ?? null,
            create: async ({ data }: any) => {
                if (coinTxs.some((t) => t.reference === data.reference)) throw new Error('unique violation');
                const row = { id: `c-${coinTxs.length + 1}`, createdAt: new Date(), ...data };
                coinTxs.push(row);
                return row;
            },
        },
        transaction: {
            create: async ({ data }: any) => {
                txs.push(data);
                return data;
            },
        },
    };
    return { tx: tx as any, coinTxs, txs };
}

const enabledConfig = (overrides: Partial<AppCurrencyConfig> = {}): AppCurrencyConfig => ({
    ...APP_CURRENCY_DEFAULTS,
    enabled: true,
    ...overrides,
});

describe('normalizeAppCurrencyConfig', () => {
    it('falls back to safe defaults for missing or bad values', () => {
        expect(normalizeAppCurrencyConfig(null)).toEqual(APP_CURRENCY_DEFAULTS);
        const config = normalizeAppCurrencyConfig({
            appCurrencyEnabled: 'yes',
            appCurrencyName: '   ',
            appCurrencyNairaPerUnit: -5,
            appCurrencyMinConversion: 1000,
            appCurrencyMaxConversion: 10,
        });
        expect(config.enabled).toBe(false);
        expect(config.name).toBe('Harvest Coins');
        expect(config.nairaPerUnit).toBe(1);
        expect(config.maxConversion).toBe(1000);
    });
});

describe('rate maths', () => {
    it('converts naira to coins and rounds the coins needed UP', () => {
        expect(nairaToCoins(1000, { nairaPerUnit: 10 })).toBe(100);
        expect(coinsRequiredFor(100, { nairaPerUnit: 3 })).toBe(33.34);
        expect(coinsRequiredFor(300, { nairaPerUnit: 3 })).toBe(100);
    });
});

describe('convertNairaToCoins', () => {
    it('moves naira into coins and writes both ledgers', async () => {
        const wallets = [{ id: 'w1', userId: 'u1', balance: 5000, coinBalance: 0, isActive: true }];
        const { tx, coinTxs, txs } = createFakeTx(wallets);

        const result = await convertNairaToCoins(tx, {
            userId: 'u1',
            nairaAmount: 2000,
            reference: 'REF-1',
            config: enabledConfig({ nairaPerUnit: 2 }),
        });

        expect(result.replayed).toBe(false);
        expect(wallets[0]).toMatchObject({ balance: 3000, coinBalance: 1000 });
        expect(coinTxs[0]).toMatchObject({ type: 'CONVERSION', amount: 1000, balanceBefore: 0, balanceAfter: 1000 });
        expect(txs[0]).toMatchObject({ type: 'CURRENCY_CONVERSION', amount: 2000, balanceBefore: 5000, balanceAfter: 3000 });
    });

    it('is idempotent on the reference', async () => {
        const wallets = [{ id: 'w1', userId: 'u1', balance: 5000, coinBalance: 0, isActive: true }];
        const { tx } = createFakeTx(wallets);
        const params = { userId: 'u1', nairaAmount: 1000, reference: 'REF-2', config: enabledConfig() };

        await convertNairaToCoins(tx, params);
        const replay = await convertNairaToCoins(tx, params);

        expect(replay.replayed).toBe(true);
        expect(wallets[0]).toMatchObject({ balance: 4000, coinBalance: 1000 });
    });

    it('rejects when disabled, outside limits, or the naira balance is too low', async () => {
        const wallets = [{ id: 'w1', userId: 'u1', balance: 500, coinBalance: 0, isActive: true }];
        const { tx } = createFakeTx(wallets);
        const base = { userId: 'u1', reference: 'R', config: enabledConfig() };

        await expect(convertNairaToCoins(tx, { ...base, nairaAmount: 200, config: { ...base.config, enabled: false } }))
            .rejects.toMatchObject({ code: 'APP_CURRENCY_DISABLED' });
        await expect(convertNairaToCoins(tx, { ...base, nairaAmount: 50 })).rejects.toMatchObject({
            code: 'CONVERSION_BELOW_MINIMUM',
        });
        await expect(convertNairaToCoins(tx, { ...base, nairaAmount: 600_000 })).rejects.toMatchObject({
            code: 'CONVERSION_ABOVE_MAXIMUM',
        });
        await expect(convertNairaToCoins(tx, { ...base, nairaAmount: 1000 })).rejects.toBeInstanceOf(AppCurrencyError);
        expect(wallets[0]).toMatchObject({ balance: 500, coinBalance: 0 });
    });
});

describe('coin payments and refunds', () => {
    it('debits coins for an order and refuses when the balance is short', async () => {
        const wallets = [{ id: 'w1', userId: 'u1', balance: 0, coinBalance: 100, isActive: true }];
        const { tx } = createFakeTx(wallets);
        const config = enabledConfig({ nairaPerUnit: 1 });

        await debitCoinsForOrder(tx, {
            walletId: 'w1', nairaAmount: 60, orderId: 'o1', orderNumber: 'MHH-1', reference: 'PAY-o1', config,
        });
        expect(wallets[0]!.coinBalance).toBe(40);

        await expect(
            debitCoinsForOrder(tx, {
                walletId: 'w1', nairaAmount: 60, orderId: 'o2', orderNumber: 'MHH-2', reference: 'PAY-o2', config,
            })
        ).rejects.toMatchObject({ code: 'INSUFFICIENT_COIN_BALANCE' });
        expect(wallets[0]!.coinBalance).toBe(40);
    });

    it('refunds exactly the coins that were spent, once, even after a rate change', async () => {
        const wallets = [{ id: 'w1', userId: 'u1', balance: 0, coinBalance: 100, isActive: true }];
        const { tx } = createFakeTx(wallets);

        await debitCoinsForOrder(tx, {
            walletId: 'w1', nairaAmount: 50, orderId: 'o1', orderNumber: 'MHH-1', reference: 'PAY-o1',
            config: enabledConfig({ nairaPerUnit: 1 }),
        });
        expect(wallets[0]!.coinBalance).toBe(50);

        const first = await refundCoinsForOrder(tx, { orderId: 'o1', orderNumber: 'MHH-1', buyerUserId: 'u1', reason: 'cancelled' });
        const second = await refundCoinsForOrder(tx, { orderId: 'o1', orderNumber: 'MHH-1', buyerUserId: 'u1', reason: 'cancelled' });

        expect(first?.amount).toBe(50);
        expect(second?.reference).toBe(first?.reference);
        expect(wallets[0]!.coinBalance).toBe(100);
    });

    it('returns null when an order has no coin payment', async () => {
        const { tx } = createFakeTx([{ id: 'w1', userId: 'u1', balance: 0, coinBalance: 0, isActive: true }]);
        await expect(
            refundCoinsForOrder(tx, { orderId: 'none', orderNumber: 'X', buyerUserId: 'u1', reason: 'x' })
        ).resolves.toBeNull();
    });
});

describe('credit and debit (rewards / adjustments)', () => {
    it('creates a wallet on first credit and caps debits at the available balance', async () => {
        const wallets: WalletRow[] = [];
        const { tx } = createFakeTx(wallets);

        await creditCoins(tx, { userId: 'u9', coins: 30, type: 'REWARD', reference: 'RW-1', description: 'reward', rate: 1 });
        expect(wallets[0]).toMatchObject({ userId: 'u9', coinBalance: 30 });

        const reversal = await debitCoins(tx, {
            userId: 'u9', coins: 50, type: 'REWARD_REVERSAL', reference: 'RW-1-REV', description: 'reverse', rate: 1,
        });
        expect(reversal.coinTransaction.amount).toBe(30);
        expect(wallets[0]!.coinBalance).toBe(0);
    });
});
