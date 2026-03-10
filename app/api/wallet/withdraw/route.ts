/**
 * POST /api/wallet/withdraw — Request withdrawal (vendors only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheInvalidate } from '@/lib/cache/redis';
import { userWalletKey } from '@/lib/cache/keys';
import { TransactionType, TransactionStatus } from '../../../../prisma/generated/client';
import { UserRole } from '@/lib/constants';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.VENDOR) return NextResponse.json({ error: 'Vendors only' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { amount, bankName, accountNumber, accountName } = body;

        if (typeof amount !== 'number' || amount < 1000) {
            return NextResponse.json({ error: 'Minimum withdrawal is ₦1,000' }, { status: 400 });
        }
        if (!bankName || !accountNumber || !accountName) {
            return NextResponse.json({ error: 'Bank details are required (bankName, accountNumber, accountName)' }, { status: 400 });
        }

        const wallet = await prisma.wallet.findUnique({ where: { userId: user.userId } });
        if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        if (!wallet.isActive) return NextResponse.json({ error: 'Wallet is disabled' }, { status: 403 });
        if (wallet.balance < amount) {
            return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
        }

        const reference = `WDR-${Date.now()}`;

        const result = await prisma.$transaction(async (tx) => {
            const updated = await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: amount } },
            });

            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: TransactionType.WITHDRAWAL,
                    amount,
                    balanceBefore: wallet.balance,
                    balanceAfter: updated.balance,
                    status: TransactionStatus.PENDING,
                    reference,
                    description: 'Wallet withdrawal',
                    metadata: { bankName, accountNumber, accountName },
                },
            });

            return { wallet: updated, transaction };
        });

        await cacheInvalidate(userWalletKey(user.userId));

        return NextResponse.json({
            success: true,
            message: 'Withdrawal request submitted. Funds will be transferred within 24 hours.',
            ...result,
        });
    } catch (error) {
        console.error('POST /api/wallet/withdraw error:', error);
        return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
    }
}
