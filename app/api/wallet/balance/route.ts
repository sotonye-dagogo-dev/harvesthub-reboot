/**
 * GET /api/wallet/balance — Get wallet balance only
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';

export async function GET(_req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const wallet = await prisma.wallet.findUnique({
            where: { userId: user.userId },
            select: { balance: true, currency: true },
        });
        if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });

        return NextResponse.json({ success: true, balance: wallet.balance, currency: wallet.currency });
    } catch (error) {
        console.error('GET /api/wallet/balance error:', error);
        return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
    }
}
