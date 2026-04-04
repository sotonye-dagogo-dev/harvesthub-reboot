import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@/lib/constants';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rateLimit = await rateLimitByUser(user.userId);
        if (!rateLimit.success) {
            return getRateLimitResponse(rateLimit);
        }

        const { id } = await context.params;
        if (user.role !== UserRole.ADMIN && user.userId !== id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const addresses = await prisma.address.findMany({
            where: { userId: id },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });

        return NextResponse.json({ success: true, addresses });
    } catch (error) {
        console.error('GET /api/users/[id]/addresses error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
