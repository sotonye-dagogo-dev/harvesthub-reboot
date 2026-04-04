/**
 * POST /api/wallet/deposit-request — Bank transfer deposit with proof
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { TransactionType, TransactionStatus } from '../../../../prisma/generated/client';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function POST(req: NextRequest) {
  return withApiHandler('POST /api/wallet/deposit-request', async () => {
    const user = await getCurrentUser();
    if (!user) return apiError('Unauthorized', 401);

    const rl = await rateLimitByUser(user.userId);
    if (!rl.success) return getRateLimitResponse(rl);

    const body = await req.json();
    const { amount, imageUrl, imagePublicId, bankReference } = body;

    if (typeof amount !== 'number' || amount < 100) {
      return apiError('Minimum deposit is ₦100', 400);
    }
    if (!imageUrl) {
      return apiError('Proof of transfer image is required', 400);
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.userId } });
    if (!wallet) return apiError('Wallet not found', 404);
    if (!wallet.isActive) return apiError('Wallet is disabled', 403);

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

    return apiSuccess({
      message: 'Deposit request submitted. It will be credited once verified by admin.',
      transaction: result.transaction,
      proof: result.proof,
    });
  });
}
