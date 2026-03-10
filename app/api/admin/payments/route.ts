/**
 * GET /api/admin/payments — List proof-of-transfer records
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { ProofOfTransferStatus } from '@/prisma/generated/client';
import { UserRole } from '@/lib/constants';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') as ProofOfTransferStatus | null;

        const where = status && Object.values(ProofOfTransferStatus).includes(status) ? { status } : {};

        const proofs = await prisma.proofOfTransfer.findMany({
            where,
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, proofs });
    } catch (error) {
        console.error('GET /api/admin/payments error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
