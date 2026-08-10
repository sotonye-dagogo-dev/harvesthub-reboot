/**
 * GET    /api/banners/[id] � Banner detail
 * PUT    /api/banners/[id] � Update banner (admin)
 * PATCH  /api/banners/[id] � Track banner event (public) - IMPRESSION / CLICK / CONVERSION
 * DELETE /api/banners/[id] � Delete banner (admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@/prisma/generated/client';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheInvalidate } from '@/lib/cache/redis';
import { bannerKey } from '@/lib/cache/keys';
import { UserRole } from '@/lib/constants';
import { isBannerEventType, type BannerEventKind } from '@/lib/analytics/bannerAnalytics';
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
    return handleTrackEvent(req, context);
}

/** POST alias of the tracking endpoint so `navigator.sendBeacon` (POST-only) works at navigation time. */
export async function POST(req: NextRequest, context: RouteContext) {
    return handleTrackEvent(req, context);
}

async function handleTrackEvent(req: NextRequest, context: RouteContext) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { id } = await context.params;
        const banner = await prisma.banner.findUnique({ where: { id } });
        if (!banner) return NextResponse.json({ error: 'Banner not found' }, { status: 404 });

        let body: {
            type?: string;
            visitorId?: string;
            source?: string;
            metadata?: unknown;
        } = {};
        try {
            const parsed = await req.json();
            if (parsed && typeof parsed === 'object') body = parsed;
        } catch (e) {
            // Empty/invalid body defaults to a CLICK event for backward compatibility.
        }

        const eventType: BannerEventKind = isBannerEventType(body.type) ? body.type : 'CLICK';
        const visitorId =
            typeof body.visitorId === 'string' && body.visitorId.trim().length > 0
                ? body.visitorId.trim().slice(0, 200)
                : null;
        const source =
            typeof body.source === 'string' && body.source.trim().length > 0
                ? body.source.trim().slice(0, 50)
                : null;
        const metadata =
            body.metadata && typeof body.metadata === 'object' && body.metadata !== null
                ? (body.metadata as Prisma.InputJsonValue)
                : null;

        const user = await getCurrentUser();

        // Granular event log (best-effort; a failed insert must not break tracking).
        const eventPromise = prisma.bannerEvent.create({
            data: {
                bannerId: id,
                type: eventType,
                userId: user?.userId ?? null,
                visitorId,
                source,
                ...(metadata !== null ? { metadata } : {}),
            },
        });

        // Denormalized counter increment for fast dashboard reads.
        const counter: Record<string, { increment: number }> =
            eventType === 'IMPRESSION'
                ? { impressionCount: { increment: 1 } }
                : eventType === 'CONVERSION'
                    ? { conversionCount: { increment: 1 } }
                    : { clickCount: { increment: 1 } };

        const [eventResult, updated] = await Promise.allSettled([
            eventPromise,
            prisma.banner.update({ where: { id }, data: counter }),
        ]);

        if (updated.status === 'rejected') {
            throw updated.reason;
        }
        if (eventResult.status === 'rejected') {
            console.warn('PATCH /api/banners/[id] event log insert failed:', eventResult.reason);
        }

        return NextResponse.json({
            success: true,
            clicks: updated.value.clickCount,
            impressions: updated.value.impressionCount,
            conversions: updated.value.conversionCount,
        });
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
