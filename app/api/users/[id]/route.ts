/**
 * GET    /api/users/[id] � Get user profile
 * PUT    /api/users/[id] � Update user
 * DELETE /api/users/[id] � Delete user (admin/self)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/cache/redis';
import { userProfileKey } from '@/lib/cache/keys';
import { UserRole } from '@/lib/constants';

interface RouteContext { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        if (user.role !== UserRole.ADMIN && user.userId !== id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const cacheK = userProfileKey(id);
        const cached = await cacheGet(cacheK);
        if (cached) return NextResponse.json({ success: true, user: cached });

        const found = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true, firstName: true, lastName: true, email: true,
                phoneNumber: true, profilePicture: true, role: true, emailVerified: true,
                createdAt: true, updatedAt: true,
                buyer: { select: { id: true } },
                vendor: { select: { id: true, storeName: true } },
            },
        });
        if (!found) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        await cacheSet(cacheK, found, 300);
        return NextResponse.json({ success: true, user: found });
    } catch (error) {
        console.error('GET /api/users/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        if (user.role !== UserRole.ADMIN && user.userId !== id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'profilePicture'];
        if (user.role === UserRole.ADMIN) {
            allowedFields.push('role', 'emailVerified');
        }
        const data: Record<string, unknown> = {};
        for (const key of allowedFields) {
            if (body[key] !== undefined) data[key] = body[key];
        }

        const updated = await prisma.user.update({ where: { id }, data });
        await cacheInvalidate(userProfileKey(id));
        return NextResponse.json({ success: true, user: updated });
    } catch (error) {
        console.error('PUT /api/users/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        if (user.role !== UserRole.ADMIN && user.userId !== id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.user.delete({ where: { id } });
        await cacheInvalidate(userProfileKey(id));
        return NextResponse.json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.error('DELETE /api/users/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
