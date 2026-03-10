/**
 * GET /api/users — Admin-only user list
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { Prisma } from '../../../prisma/generated/client';
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
        const role = searchParams.get('role');
        const isActive = searchParams.get('isActive');
        const search = searchParams.get('search');

        const where: Prisma.UserWhereInput = {};
        if (role) where.role = role as Prisma.EnumUserRoleFilter;
        if (isActive !== null && isActive !== undefined && isActive !== '') {
            where.isActive = isActive === 'true';
        }
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phoneNumber: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true, firstName: true, lastName: true, email: true, phoneNumber: true,
                    role: true, isActive: true, emailVerified: true, profilePicture: true,
                    createdAt: true, updatedAt: true,
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            users,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GET /api/users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
