/**
 * In-app currency ("Harvest Coins" by default).
 *
 * Rules (Phase 2 decisions):
 * - The super admin (ADMIN role) turns the currency on/off and sets its name, symbol and rate.
 * - One-way: users convert naira from their wallet into coins; coins are spent, never withdrawn.
 * - Paying with coins behaves like a wallet payment: the order is PAID immediately and the vendor
 *   is settled in naira through the normal payout flow. Refunds of coin-paid orders return coins.
 * - Every coin movement writes a CoinTransaction with a unique `reference`, so replays are no-ops.
 * - Balance changes use guarded atomic updates (never read-modify-write) to avoid lost updates.
 */
import { Prisma } from '@/prisma/generated/client';

type Tx = Prisma.TransactionClient;
type ConfigClient = { commerceLifecycleConfig: Tx['commerceLifecycleConfig'] };

const CONFIG_KEY = 'default';

export const APP_CURRENCY_DEFAULTS = {
    enabled: false,
    name: 'Harvest Coins',
    symbol: 'HC',
    nairaPerUnit: 1,
    minConversion: 100,
    maxConversion: 500_000,
    checkoutEnabled: true,
} as const;

export type AppCurrencyConfig = {
    enabled: boolean;
    name: string;
    symbol: string;
    /** Naira value of one coin */
    nairaPerUnit: number;
    /** Per-conversion limits, in naira */
    minConversion: number;
    maxConversion: number;
    checkoutEnabled: boolean;
};

export class AppCurrencyError extends Error {
    constructor(
        public readonly code:
            | 'APP_CURRENCY_DISABLED'
            | 'APP_CURRENCY_CHECKOUT_DISABLED'
            | 'WALLET_NOT_AVAILABLE'
            | 'INSUFFICIENT_WALLET_BALANCE'
            | 'INSUFFICIENT_COIN_BALANCE'
            | 'CONVERSION_BELOW_MINIMUM'
            | 'CONVERSION_ABOVE_MAXIMUM'
            | 'INVALID_AMOUNT',
        message?: string
    ) {
        super(message ?? code);
        this.name = 'AppCurrencyError';
    }
}

export function roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function finiteOr(value: unknown, fallback: number): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function cleanText(value: unknown, fallback: string, maxLength: number): string {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.replace(/\s+/g, ' ').trim();
    return trimmed.length > 0 ? trimmed.slice(0, maxLength) : fallback;
}

/** Never throws: bad stored values fall back to safe defaults. */
export function normalizeAppCurrencyConfig(row: Partial<Record<string, unknown>> | null | undefined): AppCurrencyConfig {
    const source = row ?? {};
    const nairaPerUnit = finiteOr(source.appCurrencyNairaPerUnit, APP_CURRENCY_DEFAULTS.nairaPerUnit);
    const minConversion = Math.max(0, finiteOr(source.appCurrencyMinConversion, APP_CURRENCY_DEFAULTS.minConversion));
    const maxConversionRaw = finiteOr(source.appCurrencyMaxConversion, APP_CURRENCY_DEFAULTS.maxConversion);

    return {
        enabled: source.appCurrencyEnabled === true,
        name: cleanText(source.appCurrencyName, APP_CURRENCY_DEFAULTS.name, 40),
        symbol: cleanText(source.appCurrencySymbol, APP_CURRENCY_DEFAULTS.symbol, 8),
        nairaPerUnit: nairaPerUnit > 0 ? roundMoney(nairaPerUnit) || APP_CURRENCY_DEFAULTS.nairaPerUnit : APP_CURRENCY_DEFAULTS.nairaPerUnit,
        minConversion: roundMoney(minConversion),
        maxConversion: roundMoney(Math.max(minConversion, maxConversionRaw)),
        checkoutEnabled: source.appCurrencyCheckoutEnabled !== false,
    };
}

const CONFIG_SELECT = {
    appCurrencyEnabled: true,
    appCurrencyName: true,
    appCurrencySymbol: true,
    appCurrencyNairaPerUnit: true,
    appCurrencyMinConversion: true,
    appCurrencyMaxConversion: true,
    appCurrencyCheckoutEnabled: true,
} as const;

export async function getAppCurrencyConfig(client: ConfigClient): Promise<AppCurrencyConfig> {
    try {
        const row = await client.commerceLifecycleConfig.upsert({
            where: { key: CONFIG_KEY },
            update: {},
            create: { key: CONFIG_KEY },
            select: CONFIG_SELECT,
        });
        return normalizeAppCurrencyConfig(row as Record<string, unknown>);
    } catch (error) {
        // Fail closed: if config can't be read, the currency is treated as disabled.
        console.error('[appCurrency] config read failed; treating as disabled', error);
        return { ...APP_CURRENCY_DEFAULTS };
    }
}

export async function updateAppCurrencyConfig(
    client: ConfigClient,
    patch: Partial<AppCurrencyConfig>
): Promise<AppCurrencyConfig> {
    const current = await getAppCurrencyConfig(client);
    const next = normalizeAppCurrencyConfig({
        appCurrencyEnabled: patch.enabled ?? current.enabled,
        appCurrencyName: patch.name ?? current.name,
        appCurrencySymbol: patch.symbol ?? current.symbol,
        appCurrencyNairaPerUnit: patch.nairaPerUnit ?? current.nairaPerUnit,
        appCurrencyMinConversion: patch.minConversion ?? current.minConversion,
        appCurrencyMaxConversion: patch.maxConversion ?? current.maxConversion,
        appCurrencyCheckoutEnabled: patch.checkoutEnabled ?? current.checkoutEnabled,
    });

    const data = {
        appCurrencyEnabled: next.enabled,
        appCurrencyName: next.name,
        appCurrencySymbol: next.symbol,
        appCurrencyNairaPerUnit: next.nairaPerUnit,
        appCurrencyMinConversion: next.minConversion,
        appCurrencyMaxConversion: next.maxConversion,
        appCurrencyCheckoutEnabled: next.checkoutEnabled,
    };

    await client.commerceLifecycleConfig.upsert({
        where: { key: CONFIG_KEY },
        update: data,
        create: { key: CONFIG_KEY, ...data },
    });
    return next;
}

export function nairaToCoins(naira: number, config: Pick<AppCurrencyConfig, 'nairaPerUnit'>): number {
    return roundMoney(naira / config.nairaPerUnit);
}

export function coinsToNaira(coins: number, config: Pick<AppCurrencyConfig, 'nairaPerUnit'>): number {
    return roundMoney(coins * config.nairaPerUnit);
}

/** Coins needed to pay a naira amount — rounded UP to the nearest 0.01 so the platform is never short. */
export function coinsRequiredFor(naira: number, config: Pick<AppCurrencyConfig, 'nairaPerUnit'>): number {
    return Math.ceil((naira / config.nairaPerUnit) * 100 - 1e-9) / 100;
}

export function formatCoins(coins: number, config: Pick<AppCurrencyConfig, 'symbol'>): string {
    return `${config.symbol} ${roundMoney(coins).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

async function findExistingByReference(tx: Tx, reference: string) {
    return tx.coinTransaction.findUnique({ where: { reference } });
}

/**
 * Debit naira from the wallet and credit coins in one transaction.
 * Idempotent on `reference`.
 */
export async function convertNairaToCoins(
    tx: Tx,
    params: { userId: string; nairaAmount: number; reference: string; config: AppCurrencyConfig }
) {
    const { userId, reference, config } = params;
    const nairaAmount = roundMoney(params.nairaAmount);

    if (!config.enabled) throw new AppCurrencyError('APP_CURRENCY_DISABLED');
    if (!Number.isFinite(nairaAmount) || nairaAmount <= 0) throw new AppCurrencyError('INVALID_AMOUNT');
    if (nairaAmount < config.minConversion) throw new AppCurrencyError('CONVERSION_BELOW_MINIMUM');
    if (nairaAmount > config.maxConversion) throw new AppCurrencyError('CONVERSION_ABOVE_MAXIMUM');

    const existing = await findExistingByReference(tx, reference);
    if (existing) return { replayed: true as const, coinTransaction: existing };

    const wallet = await tx.wallet.findUnique({ where: { userId }, select: { id: true, isActive: true } });
    if (!wallet || !wallet.isActive) throw new AppCurrencyError('WALLET_NOT_AVAILABLE');

    const coins = nairaToCoins(nairaAmount, config);
    if (coins <= 0) throw new AppCurrencyError('INVALID_AMOUNT');

    // Guarded atomic move: only succeeds if the naira balance covers the amount right now.
    const moved = await tx.wallet.updateMany({
        where: { id: wallet.id, isActive: true, balance: { gte: nairaAmount } },
        data: { balance: { decrement: nairaAmount }, coinBalance: { increment: coins } },
    });
    if (moved.count !== 1) throw new AppCurrencyError('INSUFFICIENT_WALLET_BALANCE');

    const after = await tx.wallet.findUniqueOrThrow({
        where: { id: wallet.id },
        select: { balance: true, coinBalance: true },
    });

    await tx.transaction.create({
        data: {
            walletId: wallet.id,
            type: 'CURRENCY_CONVERSION',
            amount: nairaAmount,
            balanceBefore: roundMoney(after.balance + nairaAmount),
            balanceAfter: roundMoney(after.balance),
            status: 'COMPLETED',
            reference: `${reference}-NGN`,
            description: `Converted to ${config.name}`,
            metadata: { coins, rate: config.nairaPerUnit, symbol: config.symbol },
        },
    });

    const coinTransaction = await tx.coinTransaction.create({
        data: {
            walletId: wallet.id,
            type: 'CONVERSION',
            amount: coins,
            balanceBefore: roundMoney(after.coinBalance - coins),
            balanceAfter: roundMoney(after.coinBalance),
            nairaValue: nairaAmount,
            rate: config.nairaPerUnit,
            reference,
            description: `Converted ₦${nairaAmount.toLocaleString('en-NG')} to ${config.name}`,
        },
    });

    return { replayed: false as const, coinTransaction };
}

/** Debit coins for one order. Idempotent on `reference`. */
export async function debitCoinsForOrder(
    tx: Tx,
    params: {
        walletId: string;
        nairaAmount: number;
        orderId: string;
        orderNumber: string;
        reference: string;
        config: AppCurrencyConfig;
        metadata?: Record<string, unknown>;
    }
) {
    const existing = await findExistingByReference(tx, params.reference);
    if (existing) return existing;

    const coins = coinsRequiredFor(params.nairaAmount, params.config);
    const moved = await tx.wallet.updateMany({
        where: { id: params.walletId, isActive: true, coinBalance: { gte: coins } },
        data: { coinBalance: { decrement: coins } },
    });
    if (moved.count !== 1) throw new AppCurrencyError('INSUFFICIENT_COIN_BALANCE');

    const after = await tx.wallet.findUniqueOrThrow({ where: { id: params.walletId }, select: { coinBalance: true } });

    return tx.coinTransaction.create({
        data: {
            walletId: params.walletId,
            type: 'PAYMENT',
            amount: coins,
            balanceBefore: roundMoney(after.coinBalance + coins),
            balanceAfter: roundMoney(after.coinBalance),
            nairaValue: roundMoney(params.nairaAmount),
            rate: params.config.nairaPerUnit,
            reference: params.reference,
            description: `Paid for order ${params.orderNumber}`,
            orderId: params.orderId,
            metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
        },
    });
}

/**
 * Credit coins (rewards, refunds, admin adjustments). Idempotent on `reference`.
 * Creates the wallet if the user does not have one yet.
 */
export async function creditCoins(
    tx: Tx,
    params: {
        userId: string;
        coins: number;
        type: 'REFUND' | 'REWARD' | 'ADJUSTMENT';
        reference: string;
        description: string;
        rate: number;
        orderId?: string | null;
        metadata?: Record<string, unknown>;
    }
) {
    const existing = await findExistingByReference(tx, params.reference);
    if (existing) return { replayed: true as const, coinTransaction: existing };

    const coins = roundMoney(params.coins);
    if (!Number.isFinite(coins) || coins <= 0) throw new AppCurrencyError('INVALID_AMOUNT');

    const wallet = await tx.wallet.upsert({
        where: { userId: params.userId },
        update: { coinBalance: { increment: coins } },
        create: { userId: params.userId, currency: 'NGN', coinBalance: coins },
        select: { id: true, coinBalance: true },
    });

    const coinTransaction = await tx.coinTransaction.create({
        data: {
            walletId: wallet.id,
            type: params.type,
            amount: coins,
            balanceBefore: roundMoney(wallet.coinBalance - coins),
            balanceAfter: roundMoney(wallet.coinBalance),
            nairaValue: roundMoney(coins * params.rate),
            rate: params.rate,
            reference: params.reference,
            description: params.description,
            orderId: params.orderId ?? null,
            metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
        },
    });
    return { replayed: false as const, coinTransaction };
}

/**
 * Debit coins without an order (reward reversals, admin adjustments). Idempotent on `reference`.
 * Never takes the balance below zero: debits at most what is available.
 */
export async function debitCoins(
    tx: Tx,
    params: {
        userId: string;
        coins: number;
        type: 'REWARD_REVERSAL' | 'ADJUSTMENT';
        reference: string;
        description: string;
        rate: number;
        metadata?: Record<string, unknown>;
    }
) {
    const existing = await findExistingByReference(tx, params.reference);
    if (existing) return { replayed: true as const, coinTransaction: existing };

    const wallet = await tx.wallet.findUnique({ where: { userId: params.userId }, select: { id: true, coinBalance: true } });
    if (!wallet) throw new AppCurrencyError('WALLET_NOT_AVAILABLE');

    const coins = roundMoney(Math.min(Math.max(0, params.coins), wallet.coinBalance));
    if (coins <= 0) throw new AppCurrencyError('INSUFFICIENT_COIN_BALANCE');

    const moved = await tx.wallet.updateMany({
        where: { id: wallet.id, coinBalance: { gte: coins } },
        data: { coinBalance: { decrement: coins } },
    });
    if (moved.count !== 1) throw new AppCurrencyError('INSUFFICIENT_COIN_BALANCE');

    const after = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id }, select: { coinBalance: true } });
    const coinTransaction = await tx.coinTransaction.create({
        data: {
            walletId: wallet.id,
            type: params.type,
            amount: coins,
            balanceBefore: roundMoney(after.coinBalance + coins),
            balanceAfter: roundMoney(after.coinBalance),
            nairaValue: roundMoney(coins * params.rate),
            rate: params.rate,
            reference: params.reference,
            description: params.description,
            metadata: {
                ...(params.metadata ?? {}),
                requestedCoins: params.coins,
                partial: coins < params.coins,
            } as Prisma.InputJsonValue,
        },
    });
    return { replayed: false as const, coinTransaction };
}

/**
 * Return the coins paid for an order back to the buyer (cancellation / approved refund).
 * Uses the coins recorded at payment time — not today's rate. Idempotent per order.
 * Returns null when the order has no coin payment to refund.
 */
export async function refundCoinsForOrder(
    tx: Tx,
    params: { orderId: string; orderNumber: string; buyerUserId: string; reason: string; metadata?: Record<string, unknown> }
) {
    const payment = await tx.coinTransaction.findFirst({
        where: { orderId: params.orderId, type: 'PAYMENT' },
        orderBy: { createdAt: 'desc' },
    });
    if (!payment) return null;

    const result = await creditCoins(tx, {
        userId: params.buyerUserId,
        coins: payment.amount,
        type: 'REFUND',
        reference: `COIN-REFUND-${params.orderId}`,
        description: `Refund for order ${params.orderNumber}: ${params.reason}`,
        rate: payment.rate,
        orderId: params.orderId,
        metadata: { ...(params.metadata ?? {}), paymentReference: payment.reference },
    });
    return result.coinTransaction;
}

export function appCurrencyErrorResponse(error: AppCurrencyError, config?: AppCurrencyConfig) {
    const name = config?.name ?? APP_CURRENCY_DEFAULTS.name;
    const messages: Record<AppCurrencyError['code'], string> = {
        APP_CURRENCY_DISABLED: `${name} is not available right now.`,
        APP_CURRENCY_CHECKOUT_DISABLED: `Paying with ${name} is not available right now.`,
        WALLET_NOT_AVAILABLE: 'Your wallet is not available.',
        INSUFFICIENT_WALLET_BALANCE: 'Your naira wallet balance is too low for this conversion. Top up your wallet first.',
        INSUFFICIENT_COIN_BALANCE: `You don't have enough ${name} for this payment.`,
        CONVERSION_BELOW_MINIMUM: config
            ? `The minimum conversion is ₦${config.minConversion.toLocaleString('en-NG')}.`
            : 'Amount is below the minimum conversion.',
        CONVERSION_ABOVE_MAXIMUM: config
            ? `The maximum conversion is ₦${config.maxConversion.toLocaleString('en-NG')}.`
            : 'Amount is above the maximum conversion.',
        INVALID_AMOUNT: 'Enter a valid amount.',
    };
    return { error: messages[error.code], code: error.code };
}
