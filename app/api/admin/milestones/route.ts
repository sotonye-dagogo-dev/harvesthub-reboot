/**
 * GET /api/admin/milestones — List milestones (paginated)
 * POST /api/admin/milestones — Create milestone(s)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { Prisma, MilestoneType } from '@/prisma/generated/client';
import { UserRole } from '@/lib/constants';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
        const milestoneType = searchParams.get('milestoneType') as MilestoneType | null;
        const userId = searchParams.get('userId');

        const where: Prisma.UserMilestoneWhereInput = {};
        if (milestoneType && Object.values(MilestoneType).includes(milestoneType)) {
            where.milestoneType = milestoneType;
        }
        if (userId) where.userId = userId;

        const [milestones, total] = await Promise.all([
            prisma.userMilestone.findMany({
                where,
                include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
                orderBy: { achievedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.userMilestone.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            milestones,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GET /api/admin/milestones error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { userIds, userId, milestoneType, label, metadata } = body;

        if (!milestoneType || !label) {
            return NextResponse.json({ error: 'milestoneType and label are required' }, { status: 400 });
        }

        const targetUserIds: string[] = userIds || (userId ? [userId] : []);
        if (targetUserIds.length === 0) {
            return NextResponse.json({ error: 'userId or userIds is required' }, { status: 400 });
        }

        const created: unknown[] = [];
        const skipped: string[] = [];

        for (const uid of targetUserIds) {
            // Deduplicate
            const existing = await prisma.userMilestone.findFirst({
                where: { userId: uid, milestoneType },
            });
            if (existing) {
                skipped.push(uid);
                continue;
            }
            const milestone = await prisma.userMilestone.create({
                data: { userId: uid, milestoneType, label, metadata },
            });
            created.push(milestone);
        }

        return NextResponse.json({
            success: true,
            created: created.length,
            skipped: skipped.length,
            milestones: created,
        }, { status: 201 });
    } catch (error) {
        console.error('POST /api/admin/milestones error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
