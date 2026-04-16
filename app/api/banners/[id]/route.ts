/**
 * GET    /api/banners/[id] � Banner detail
 * PUT    /api/banners/[id] � Update banner (admin)
 * PATCH  /api/banners/[id] � Track click (public)
 * DELETE /api/banners/[id] � Delete banner (admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheInvalidate } from '@/lib/cache/redis';
import { bannerKey } from '@/lib/cache/keys';
import { UserRole } from '@/lib/constants';
import {
    acquireIdempotencyGuard,
    buildPayloadFingerprint,
    getIdempotencyReplayResponse,
    readIdempotencyKeyHeader,
    setIdempotencyReplayResponse,
} from '@/lib/utils/idempotency';

interface RouteContext { params: Promise<{ id: string }>; }
const BANNER_UPDATE_IDEMPOTENCY_TTL_SECONDS = 60 * 5;

/**
 * Normalizes API update payload values into Prisma-compatible types.
 * Converts displayOrder to number and start/end date strings to Date objects.
 */
function normalizeBannerUpdateData(data: Record<string, unknown>) {
    if (typeof data.title === 'string') {
        data.title = data.title.trim();
    }
    if (typeof data.displayOrder === 'string' || typeof data.displayOrder === 'number') {
        data.displayOrder = Number(data.displayOrder);
    }
    if (typeof data.startDate === 'string') {
        data.startDate = new Date(data.startDate);
    }
    if (typeof data.endDate === 'string') {
        data.endDate = new Date(data.endDate);
    }
    return data;
}

export async function GET(req: NextRequest, context: RouteContext) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const banner = await prisma.banner.findUnique({ where: { id } });
        if (!banner) return NextResponse.json({ error: 'Banner not found' }, { status: 404 });

        return NextResponse.json({ success: true, banner });
    } catch (error) {
        console.error('GET /api/banners/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const banner = await prisma.banner.findUnique({ where: { id } });
        if (!banner) return NextResponse.json({ error: 'Banner not found' }, { status: 404 });

        const body = await req.json();
        const allowedFields = ['title', 'subtitle', 'description', 'imageUrl', 'linkUrl', 'isActive',
            'position', 'startDate', 'endDate', 'displayOrder', 'theme', 'accentColor', 'details', 'knowMoreLabel', 'actions', 'targetAudience'];
        const data: Record<string, unknown> = {};
        for (const key of allowedFields) {
            if (body[key] !== undefined) data[key] = body[key];
        }
        normalizeBannerUpdateData(data);

        const headerIdempotencyKey = readIdempotencyKeyHeader(req.headers);
        const fallbackFingerprint = buildPayloadFingerprint({
            id,
            data,
            updatedBy: user.userId,
        });
        const idempotencyKey = headerIdempotencyKey || fallbackFingerprint;
        const guard = await acquireIdempotencyGuard({
            scope: `banner-update:${id}`,
            key: idempotencyKey,
            ttlSeconds: BANNER_UPDATE_IDEMPOTENCY_TTL_SECONDS,
        });

        if (!guard.acquired) {
            const replay = await getIdempotencyReplayResponse({
                scope: `banner-update:${id}`,
                key: idempotencyKey,
            });
            if (replay) {
                return NextResponse.json(
                    {
                        ...replay.body,
                        idempotency: { replayed: true, key: idempotencyKey, mode: guard.mode },
                    },
                    { status: replay.status }
                );
            }

            return NextResponse.json(
                {
                    success: true,
                    duplicate: true,
                    message: 'Equivalent banner update is already processing.',
                    idempotency: { replayed: true, key: idempotencyKey, mode: guard.mode },
                },
                { status: 202 }
            );
        }

        const updated = await prisma.banner.update({ where: { id }, data });
        await cacheInvalidate('cache:banners:*');
        await cacheInvalidate('banners:*');
        await cacheInvalidate(bannerKey());
        const replayBody = { success: true, banner: updated };
        await setIdempotencyReplayResponse({
            scope: `banner-update:${id}`,
            key: idempotencyKey,
            status: 200,
            body: replayBody,
            ttlSeconds: BANNER_UPDATE_IDEMPOTENCY_TTL_SECONDS,
        });
        return NextResponse.json({
            ...replayBody,
            idempotency: { replayed: false, key: idempotencyKey, mode: guard.mode },
        });
    } catch (error) {
        console.error('PUT /api/banners/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const updated = await prisma.banner.update({
            where: { id },
            data: { clickCount: { increment: 1 } },
        });

        return NextResponse.json({ success: true, clicks: updated.clickCount });
    } catch (error) {
        console.error('PATCH /api/banners/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const banner = await prisma.banner.findUnique({ where: { id } });
        if (!banner) return NextResponse.json({ error: 'Banner not found' }, { status: 404 });

        await prisma.banner.delete({ where: { id } });
        await cacheInvalidate('cache:banners:*');
        await cacheInvalidate('banners:*');
        await cacheInvalidate(bannerKey());
        return NextResponse.json({ success: true, message: 'Banner deleted' });
    } catch (error) {
        console.error('DELETE /api/banners/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
