export interface PendingWalletTransactionLike {
    id: string;
    type: string;
    status: string;
    reference: string;
    description: string;
    metadata: unknown;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface PendingWalletTransactionRepairClient {
    transaction: {
        findMany: (args: Record<string, unknown>) => Promise<PendingWalletTransactionLike[]>;
        update: (args: Record<string, unknown>) => Promise<unknown>;
    };
}

export interface PendingWalletTransactionRepairSummary {
    inspected: number;
    repaired: number;
    skipped: number;
    dryRun: boolean;
    references: string[];
}

const PENDING = 'PENDING';
const DEPOSIT = 'DEPOSIT';
const PAYSTACK = 'PAYSTACK';

function readMetadataValue(metadata: unknown, key: string): unknown {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        return undefined;
    }

    return (metadata as Record<string, unknown>)[key];
}

export function isStuckPendingPaystackDeposit(transaction: PendingWalletTransactionLike): boolean {
    if (transaction.status !== PENDING || transaction.type !== DEPOSIT) {
        return false;
    }

    const gateway = String(readMetadataValue(transaction.metadata, 'gateway') ?? '').trim().toUpperCase();
    if (gateway !== PAYSTACK) {
        return false;
    }

    const verificationStatus = String(
        readMetadataValue(transaction.metadata, 'verificationStatus') ?? ''
    )
        .trim()
        .toUpperCase();
    const pendingConfirmation = Boolean(readMetadataValue(transaction.metadata, 'pendingConfirmation'));
    const acceptedWithoutVerification = Boolean(
        readMetadataValue(transaction.metadata, 'acceptedWithoutVerification')
    );
    const description = transaction.description.toLowerCase();

    return (
        verificationStatus === 'GATEWAY_UNAVAILABLE' ||
        pendingConfirmation ||
        acceptedWithoutVerification ||
        description.includes('awaiting payment confirmation') ||
        description.includes('verification unavailable')
    );
}

export async function repairPendingWalletTransactions({
    client,
    dryRun = true,
    logger = console,
}: {
    client: PendingWalletTransactionRepairClient;
    dryRun?: boolean;
    logger?: Pick<Console, 'info' | 'warn'>;
}): Promise<PendingWalletTransactionRepairSummary> {
    const pendingTransactions = await client.transaction.findMany({
        where: {
            status: PENDING,
            type: DEPOSIT,
        },
        select: {
            id: true,
            type: true,
            status: true,
            reference: true,
            description: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    const stuckTransactions = pendingTransactions.filter(isStuckPendingPaystackDeposit);

    if (dryRun) {
        logger.info(
            `[dry-run] Found ${stuckTransactions.length} stuck Paystack wallet deposit transaction(s) out of ${pendingTransactions.length} pending deposit(s).`
        );
        return {
            inspected: pendingTransactions.length,
            repaired: 0,
            skipped: pendingTransactions.length - stuckTransactions.length,
            dryRun: true,
            references: stuckTransactions.map((transaction) => transaction.reference),
        };
    }

    for (const transaction of stuckTransactions) {
        const previousMetadata =
            transaction.metadata && typeof transaction.metadata === 'object' && !Array.isArray(transaction.metadata)
                ? (transaction.metadata as Record<string, unknown>)
                : {};

        await client.transaction.update({
            where: { id: transaction.id },
            data: {
                status: 'FAILED',
                description: `${transaction.description} [resolved: confirmation unavailable]`,
                metadata: {
                    ...previousMetadata,
                    repairStatus: 'FAILED',
                    repairReason:
                        'Paystack verification could not be completed from this deployment environment, so the transaction was marked failed to clear the stuck pending state.',
                    repairedAt: new Date().toISOString(),
                },
            },
        });
    }

    if (stuckTransactions.length > 0) {
        logger.warn(
            `Repaired ${stuckTransactions.length} stuck Paystack wallet deposit transaction(s) by moving them from PENDING to FAILED.`
        );
    }

    return {
        inspected: pendingTransactions.length,
        repaired: stuckTransactions.length,
        skipped: pendingTransactions.length - stuckTransactions.length,
        dryRun: false,
        references: stuckTransactions.map((transaction) => transaction.reference),
    };
}