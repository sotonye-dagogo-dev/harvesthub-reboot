import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@/lib/constants';
import { getCurrentUser } from '@/lib/utils/auth';
import { getRateLimitResponse, rateLimitByUser } from '@/lib/middleware/rate-limit';
import { addressSchema, updateAddressSchema } from '@/lib/schemas/misc.schemas';
import { cacheInvalidate } from '@/lib/cache/redis';
import { userProfileKey } from '@/lib/cache/keys';

interface RouteContext {
    params: Promise<{ id: string }>;
}

function isOwnerOrAdmin(user: { userId: string; role: UserRole }, id: string): boolean {
    return user.role === UserRole.ADMIN || user.userId === id;
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
        if (!isOwnerOrAdmin(user, id)) {
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

export async function POST(req: NextRequest, context: RouteContext) {
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
        if (!isOwnerOrAdmin(user, id)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const parsed = addressSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid address payload', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const data = parsed.data;
        const address = await prisma.$transaction(async (tx) => {
            if (data.isDefault) {
                await tx.address.updateMany({
                    where: { userId: id, isDefault: true },
                    data: { isDefault: false },
                });
            }
            return tx.address.create({
                data: {
                    userId: id,
                    label: data.label ?? 'Default',
                    fullName: data.fullName,
                    phoneNumber: data.phoneNumber,
                    addressLine1: data.addressLine1,
                    addressLine2: data.addressLine2 ?? null,
                    city: data.city,
                    state: data.state,
                    campus: data.campus ?? null,
                    landmark: data.landmark ?? null,
                    isDefault: data.isDefault ?? false,
                },
            });
        });

        await cacheInvalidate(userProfileKey(id));
        return NextResponse.json({ success: true, address }, { status: 201 });
    } catch (error) {
        console.error('POST /api/users/[id]/addresses error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: RouteContext) {
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
        if (!isOwnerOrAdmin(user, id)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const parsed = updateAddressSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid address payload', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { id: addressId, ...updates } = parsed.data;
        const existing = await prisma.address.findUnique({ where: { id: addressId } });
        if (!existing || existing.userId !== id) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        const data: Record<string, unknown> = {};
        if (updates.label !== undefined) data.label = updates.label;
        if (updates.fullName !== undefined) data.fullName = updates.fullName;
        if (updates.phoneNumber !== undefined) data.phoneNumber = updates.phoneNumber;
        if (updates.addressLine1 !== undefined) data.addressLine1 = updates.addressLine1;
        if (updates.addressLine2 !== undefined) data.addressLine2 = updates.addressLine2;
        if (updates.city !== undefined) data.city = updates.city;
        if (updates.state !== undefined) data.state = updates.state;
        if (updates.campus !== undefined) data.campus = updates.campus;
        if (updates.landmark !== undefined) data.landmark = updates.landmark;
        if (updates.isDefault !== undefined) data.isDefault = updates.isDefault;

        const address = await prisma.$transaction(async (tx) => {
            if (data.isDefault === true) {
                await tx.address.updateMany({
                    where: { userId: id, isDefault: true, id: { not: addressId } },
                    data: { isDefault: false },
                });
            }
            return tx.address.update({ where: { id: addressId }, data });
        });

        await cacheInvalidate(userProfileKey(id));
        return NextResponse.json({ success: true, address });
    } catch (error) {
        console.error('PUT /api/users/[id]/addresses error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
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
        if (!isOwnerOrAdmin(user, id)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const addressId = body?.id;
        if (!addressId || typeof addressId !== 'string') {
            return NextResponse.json({ error: 'Address ID is required' }, { status: 400 });
        }

        const existing = await prisma.address.findUnique({ where: { id: addressId } });
        if (!existing || existing.userId !== id) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
        }

        await prisma.address.delete({ where: { id: addressId } });
        await cacheInvalidate(userProfileKey(id));
        return NextResponse.json({ success: true, message: 'Address deleted' });
    } catch (error) {
        console.error('DELETE /api/users/[id]/addresses error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
