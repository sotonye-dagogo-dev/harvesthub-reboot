/**
 * POST /api/wallet/deposit-request — Bank transfer deposit with proof
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { TransactionType, TransactionStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rl = await rateLimitByUser(user.userId);
    if (!rl.success) return getRateLimitResponse(rl);

    const body = await req.json();
    const { amount, imageUrl, imagePublicId, bankReference } = body;

    if (typeof amount !== 'number' || amount < 100) {
      return NextResponse.json({ error: 'Minimum deposit is ₦100' }, { status: 400 });
    }
    if (!imageUrl) {
      return NextResponse.json({ error: 'Proof of transfer image is required' }, { status: 400 });
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.userId } });
    if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    if (!wallet.isActive) return NextResponse.json({ error: 'Wallet is disabled' }, { status: 403 });

    const reference = `DEPBANK-${Date.now()}`;

    const result = await prisma.$transaction(async (tx) => {
      // Create pending transaction (admin must verify)
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.DEPOSIT,
          amount,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance, // unchanged until verified
          status: TransactionStatus.PENDING,
          reference,
          description: 'Bank transfer deposit (pending verification)',
          metadata: { bankReference, imageUrl, imagePublicId },
        },
      });

      // Create proof-of-transfer record
      const proof = await tx.proofOfTransfer.create({
        data: {
          userId: user.userId,
          imageUrl,
          imagePublicId,
          bankReference,
          amount,
        },
      });

      return { transaction, proof };
    });

    return NextResponse.json({
      success: true,
      message: 'Deposit request submitted. It will be credited once verified by admin.',
      transaction: result.transaction,
      proof: result.proof,
    });
  } catch (error) {
    console.error('POST /api/wallet/deposit-request error:', error);
    return NextResponse.json({ error: 'Failed to submit deposit request' }, { status: 500 });
  }
}
