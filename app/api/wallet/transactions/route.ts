/**
 * GET /api/wallet/transactions — List wallet transactions with filters
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { Prisma, TransactionType, TransactionStatus } from '../../../../prisma/generated/client';
import { apiError, apiSuccess, withApiHandler } from '@/lib/api/http';

export async function GET(req: NextRequest) {
    return withApiHandler('GET /api/wallet/transactions', async () => {
        const user = await getCurrentUser();
        if (!user) return apiError('Unauthorized', 401);

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const type = searchParams.get('type') as TransactionType | null;
        const status = searchParams.get('status') as TransactionStatus | null;

        const wallet = await prisma.wallet.findUnique({ where: { userId: user.userId } });
        if (!wallet) return apiError('Wallet not found', 404);

        const where: Prisma.TransactionWhereInput = { walletId: wallet.id };
        if (type && Object.values(TransactionType).includes(type)) where.type = type;
        if (status && Object.values(TransactionStatus).includes(status)) where.status = status;

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.transaction.count({ where }),
        ]);

        return apiSuccess({
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    });
}
