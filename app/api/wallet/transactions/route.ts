/**
 * GET /api/wallet/transactions — List wallet transactions with filters
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { Prisma, TransactionType, TransactionStatus } from '@/prisma/generated/client';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const type = searchParams.get('type') as TransactionType | null;
        const status = searchParams.get('status') as TransactionStatus | null;

        const wallet = await prisma.wallet.findUnique({ where: { userId: user.userId } });
        if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });

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

        return NextResponse.json({
            success: true,
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('GET /api/wallet/transactions error:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}
