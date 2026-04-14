import { Prisma, OrderStatus, PaymentStatus, TransactionStatus, TransactionType } from '@/prisma/generated/client';

export type StatusHistoryEntry = {
    status: string;
    timestamp: string;
    note?: string;
    updatedBy: string;
    [key: string]: unknown;
};

export const ORDER_PAYOUT_REFERENCE_PREFIX = 'PAYOUT-ORDER-';

export function getPayoutReference(orderId: string): string {
    return `${ORDER_PAYOUT_REFERENCE_PREFIX}${orderId}`;
}

export function parseStatusHistory(input: Prisma.JsonValue | null): StatusHistoryEntry[] {
    const normalize = (value: unknown): StatusHistoryEntry[] => {
        if (!Array.isArray(value)) return [];
        return value
            .filter((entry) => entry && typeof entry === 'object')
            .map((entry) => {
                const candidate = entry as Record<string, unknown>;
                const rawStatus =
                    typeof candidate.status === 'string'
                        ? candidate.status.trim().toUpperCase()
                        : OrderStatus.PENDING;

                return {
                    ...candidate,
                    status: rawStatus.length > 0 ? rawStatus : OrderStatus.PENDING,
                    timestamp:
                        typeof candidate.timestamp === 'string' && candidate.timestamp.trim().length > 0
                            ? candidate.timestamp
                            : new Date(0).toISOString(),
                    updatedBy:
                        typeof candidate.updatedBy === 'string' && candidate.updatedBy.trim().length > 0
                            ? candidate.updatedBy
                            : 'system',
                };
            });
    };

    if (Array.isArray(input)) return normalize(input);
    if (typeof input === 'string') {
        try {
            return normalize(JSON.parse(input));
        } catch {
            return [];
        }
    }
    return [];
}

export function appendStatusHistoryEntry(
    history: StatusHistoryEntry[],
    status: string,
    updatedBy: string,
    note?: string,
    extras?: Record<string, unknown>
): StatusHistoryEntry[] {
    const normalizedStatus = status.trim().toUpperCase();
    const lastEntry = history.at(-1);

    if (lastEntry?.status?.trim().toUpperCase() === normalizedStatus) {
        return history;
    }

    return [
        ...history,
        {
            status: normalizedStatus,
            timestamp: new Date().toISOString(),
            note: note || `Order lifecycle updated: ${normalizedStatus.toLowerCase().replace(/_/g, ' ')}.`,
            updatedBy,
            ...(extras || {}),
        },
    ];
}

export function hasHistoryStatus(history: StatusHistoryEntry[], status: string): boolean {
    const normalizedStatus = status.trim().toUpperCase();
    return history.some((entry) => entry.status.trim().toUpperCase() === normalizedStatus);
}

export function getLatestStatusTimestamp(
    history: StatusHistoryEntry[],
    status: string
): Date | null {
    const normalizedStatus = status.trim().toUpperCase();
    const matching = history
        .filter((entry) => entry.status.trim().toUpperCase() === normalizedStatus)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (matching.length === 0) return null;
    const latest = matching[0];
    if (!latest) return null;

    const timestamp = new Date(latest.timestamp);
    return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

export async function ensurePayoutHoldOnDelivery(tx: Prisma.TransactionClient, params: {
    orderId: string;
    orderNumber: string;
    vendorId: string;
    total: number;
    paymentStatus: PaymentStatus;
}) {
    if (params.paymentStatus !== PaymentStatus.PAID) {
        return { created: false, reference: null as string | null, skipped: true };
    }

    const existingPayout = await tx.transaction.findFirst({
        where: {
            orderId: params.orderId,
            type: TransactionType.PAYOUT,
        },
        select: { id: true, reference: true },
    });

    if (existingPayout) {
        return { created: false, reference: existingPayout.reference, skipped: false };
    }

    const vendorRecord = await tx.vendor.findUnique({
        where: { id: params.vendorId },
        select: { userId: true },
    });

    if (!vendorRecord) {
        return { created: false, reference: null as string | null, skipped: false };
    }

    const vendorWallet = await tx.wallet.upsert({
        where: { userId: vendorRecord.userId },
        update: {},
        create: { userId: vendorRecord.userId, currency: 'NGN' },
        select: { id: true, balance: true },
    });

    const reference = getPayoutReference(params.orderId);

    await tx.transaction.create({
        data: {
            walletId: vendorWallet.id,
            type: TransactionType.PAYOUT,
            amount: params.total,
            balanceBefore: vendorWallet.balance,
            balanceAfter: vendorWallet.balance,
            status: TransactionStatus.PENDING,
            reference,
            description: `Settlement hold created for delivered order ${params.orderNumber}`,
            metadata: {
                settlementStage: 'HELD',
                heldAt: new Date().toISOString(),
            },
            orderId: params.orderId,
        },
    });

    return { created: true, reference, skipped: false };
}

export type ReleaseOrderSettlementResult = {
    state:
    | 'released'
    | 'already_released'
    | 'not_found'
    | 'not_delivered'
    | 'not_paid'
    | 'payout_locked';
    orderId?: string;
    orderNumber?: string;
    payoutReference?: string | null;
    amount?: number;
    buyerUserId?: string;
    vendorUserId?: string;
};

export async function releaseOrderSettlement(
    tx: Prisma.TransactionClient,
    params: {
        orderId: string;
        updatedBy: string;
        autoConfirmed: boolean;
    }
): Promise<ReleaseOrderSettlementResult> {
    const order = await tx.order.findUnique({
        where: { id: params.orderId },
        select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            total: true,
            statusHistory: true,
            completedAt: true,
            vendorId: true,
            buyer: { select: { userId: true } },
            vendor: { select: { userId: true } },
        },
    });

    if (!order) return { state: 'not_found' };
    if (order.status !== OrderStatus.DELIVERED) {
        return { state: 'not_delivered', orderId: order.id, orderNumber: order.orderNumber };
    }
    if (order.paymentStatus !== PaymentStatus.PAID) {
        return { state: 'not_paid', orderId: order.id, orderNumber: order.orderNumber };
    }

    const history = parseStatusHistory(order.statusHistory as Prisma.JsonValue);
    if (hasHistoryStatus(history, 'SETTLEMENT_RELEASED')) {
        const existingPayout = await tx.transaction.findFirst({
            where: { orderId: order.id, type: TransactionType.PAYOUT },
            select: { reference: true },
            orderBy: { createdAt: 'desc' },
        });

        return {
            state: 'already_released',
            orderId: order.id,
            orderNumber: order.orderNumber,
            payoutReference: existingPayout?.reference || null,
            amount: order.total,
            buyerUserId: order.buyer.userId,
            vendorUserId: order.vendor.userId,
        };
    }

    const hold = await ensurePayoutHoldOnDelivery(tx, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        vendorId: order.vendorId,
        total: order.total,
        paymentStatus: order.paymentStatus,
    });

    const payoutReference = hold.reference || getPayoutReference(order.id);
    const payout = await tx.transaction.findFirst({
        where: {
            orderId: order.id,
            type: TransactionType.PAYOUT,
            reference: payoutReference,
        },
        select: {
            id: true,
            status: true,
            walletId: true,
            metadata: true,
        },
    });

    if (!payout) {
        return { state: 'payout_locked', orderId: order.id, orderNumber: order.orderNumber };
    }

    if (payout.status === TransactionStatus.COMPLETED) {
        const nextHistory = appendStatusHistoryEntry(
            history,
            params.autoConfirmed ? 'AUTO_CONFIRMED' : 'BUYER_CONFIRMED',
            params.updatedBy,
            params.autoConfirmed
                ? 'Order auto-confirmed after delivery confirmation SLA.'
                : 'Buyer confirmed delivered order.'
        );

        const nextHistoryWithRelease = appendStatusHistoryEntry(
            nextHistory,
            'SETTLEMENT_RELEASED',
            params.updatedBy,
            'Settlement already released; idempotent replay acknowledged.',
            { payoutReference }
        );

        await tx.order.update({
            where: { id: order.id },
            data: {
                statusHistory: nextHistoryWithRelease as Prisma.InputJsonValue,
                completedAt: order.completedAt ?? new Date(),
            },
        });

        return {
            state: 'already_released',
            orderId: order.id,
            orderNumber: order.orderNumber,
            payoutReference,
            amount: order.total,
            buyerUserId: order.buyer.userId,
            vendorUserId: order.vendor.userId,
        };
    }

    if (payout.status === TransactionStatus.REVERSED || payout.status === TransactionStatus.FAILED) {
        return { state: 'payout_locked', orderId: order.id, orderNumber: order.orderNumber };
    }

    const wallet = await tx.wallet.findUnique({
        where: { id: payout.walletId },
        select: { id: true, balance: true },
    });

    if (!wallet) {
        return { state: 'payout_locked', orderId: order.id, orderNumber: order.orderNumber };
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + order.total;

    await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
    });

    await tx.transaction.update({
        where: { id: payout.id },
        data: {
            status: TransactionStatus.COMPLETED,
            balanceBefore,
            balanceAfter,
            description: `Settlement released for order ${order.orderNumber}`,
            metadata: {
                ...(payout.metadata && typeof payout.metadata === 'object' && !Array.isArray(payout.metadata)
                    ? (payout.metadata as Record<string, unknown>)
                    : {}),
                settlementStage: 'RELEASED',
                releasedAt: new Date().toISOString(),
                releasedBy: params.updatedBy,
            },
        },
    });

    const nextHistory = appendStatusHistoryEntry(
        history,
        params.autoConfirmed ? 'AUTO_CONFIRMED' : 'BUYER_CONFIRMED',
        params.updatedBy,
        params.autoConfirmed
            ? 'Order auto-confirmed after delivery confirmation SLA.'
            : 'Buyer confirmed delivered order.'
    );

    const nextHistoryWithRelease = appendStatusHistoryEntry(
        nextHistory,
        'SETTLEMENT_RELEASED',
        params.updatedBy,
        'Settlement released to vendor wallet.',
        { payoutReference }
    );

    await tx.order.update({
        where: { id: order.id },
        data: {
            statusHistory: nextHistoryWithRelease as Prisma.InputJsonValue,
            completedAt: order.completedAt ?? new Date(),
        },
    });

    return {
        state: 'released',
        orderId: order.id,
        orderNumber: order.orderNumber,
        payoutReference,
        amount: order.total,
        buyerUserId: order.buyer.userId,
        vendorUserId: order.vendor.userId,
    };
}
