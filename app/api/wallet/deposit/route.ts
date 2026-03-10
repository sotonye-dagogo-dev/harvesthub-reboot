/**
 * POST /api/wallet/deposit — Instant deposit (card/USSD payment confirmed)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheInvalidate } from '@/lib/cache/redis';
import { userWalletKey } from '@/lib/cache/keys';
import { TransactionType, TransactionStatus } from '../../../../prisma/generated/client';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { amount, description, paymentReference } = body;

        if (typeof amount !== 'number' || amount < 100) {
            return NextResponse.json({ error: 'Minimum deposit is ₦100' }, { status: 400 });
        }

        const wallet = await prisma.wallet.findUnique({ where: { userId: user.userId } });
        if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        if (!wallet.isActive) return NextResponse.json({ error: 'Wallet is disabled' }, { status: 403 });

        const reference = paymentReference || `DEP-${Date.now()}`;

        const result = await prisma.$transaction(async (tx) => {
            const updated = await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: amount } },
            });

            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: TransactionType.DEPOSIT,
                    amount,
                    balanceBefore: wallet.balance,
                    balanceAfter: updated.balance,
                    status: TransactionStatus.COMPLETED,
                    reference,
                    description: description || 'Wallet deposit',
                },
            });

            return { wallet: updated, transaction };
        });

        await cacheInvalidate(userWalletKey(user.userId));

        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        console.error('POST /api/wallet/deposit error:', error);
        return NextResponse.json({ error: 'Failed to process deposit' }, { status: 500 });
    }
}
