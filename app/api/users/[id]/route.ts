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
import { UserRole, UserStatus } from '@/lib/constants';

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
                status: true, isActive: true,
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
            allowedFields.push('role', 'emailVerified', 'status', 'isActive');
        }
        const data: Record<string, unknown> = {};
        for (const key of allowedFields) {
            if (body[key] !== undefined) data[key] = body[key];
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        // Guard: an admin must never lock themselves out or demote themselves.
        if (user.role === UserRole.ADMIN && id === user.userId) {
            if (data.role && data.role !== UserRole.ADMIN) {
                return NextResponse.json(
                    { error: 'You cannot change your own role' },
                    { status: 400 }
                );
            }
            if (data.status && data.status !== UserStatus.ACTIVE) {
                return NextResponse.json(
                    { error: 'You cannot deactivate your own account' },
                    { status: 400 }
                );
            }
            if (data.isActive === false) {
                return NextResponse.json(
                    { error: 'You cannot deactivate your own account' },
                    { status: 400 }
                );
            }
        }

        // Keep `status` and `isActive` in sync — `status` is the source of truth.
        if (typeof data.status === 'string') {
            const status = data.status as UserStatus;
            if (!Object.values(UserStatus).includes(status)) {
                return NextResponse.json({ error: 'Invalid user status' }, { status: 400 });
            }
            data.isActive = status === UserStatus.ACTIVE;
        } else if (typeof data.isActive === 'boolean') {
            data.status = data.isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE;
        }

        // Only allow role changes between known roles.
        if (data.role && !Object.values(UserRole).includes(data.role as UserRole)) {
            return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
        }

        const updated = await prisma.user.update({ where: { id }, data });

        const safeUser = {
            id: updated.id,
            firstName: updated.firstName,
            lastName: updated.lastName,
            email: updated.email,
            phoneNumber: updated.phoneNumber,
            profilePicture: updated.profilePicture,
            role: updated.role,
            emailVerified: updated.emailVerified,
            status: updated.status,
            isActive: updated.isActive,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
        };

        await cacheInvalidate(userProfileKey(id));
        return NextResponse.json({ success: true, user: safeUser });
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
