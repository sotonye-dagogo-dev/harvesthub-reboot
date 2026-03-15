/**
 * GET /api/banners — List banners (public)
 * POST /api/banners — Create banner (admin only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { db } from '@/lib/data/database';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByIP, rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { cacheGet, cacheSet, cacheInvalidate } from '@/lib/cache/redis';
import { bannerKey } from '@/lib/cache/keys';
import { Prisma } from '../../../prisma/generated/client';
import { UserRole } from '@/lib/constants';

export async function GET(req: NextRequest) {
    try {
        const rl = await rateLimitByIP(req);
        if (!rl.success) return getRateLimitResponse(rl);

        const { searchParams } = new URL(req.url);
        const active = searchParams.get('active');
        const position = searchParams.get('position');

        const cacheKey = bannerKey();
        const cached = await cacheGet(cacheKey);
        if (cached) return NextResponse.json(cached);

        const filters: any = {};
        if (active === 'true') filters.isActive = true;
        if (position) filters.position = position;

        const banners = await db.banners.findAll(filters as any);

        const result = { success: true, banners };
        await cacheSet(cacheKey, result, 300);
        return NextResponse.json(result);
    } catch (error) {
        console.error('GET /api/banners error:', error);
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
        const { title, subtitle, description, imageUrl, linkUrl, actions, position, theme,
            accentColor, details, knowMoreLabel, isActive, startDate, endDate,
            displayOrder, targetAudience } = body;

        if (!title || !imageUrl) {
            return NextResponse.json({ error: 'title and imageUrl are required' }, { status: 400 });
        }

        const banner = await db.banners.create({
            title,
            subtitle,
            description,
            imageUrl,
            linkUrl,
            actions,
            position: position || 'HERO',
            theme: theme || 'BUSINESS',
            accentColor,
            details,
            knowMoreLabel,
            isActive: isActive ?? true,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            displayOrder: displayOrder ?? 0,
            targetAudience: targetAudience || [],
            createdBy: user.userId,
        } as any);

        await cacheInvalidate('banners:*');
        return NextResponse.json({ success: true, banner }, { status: 201 });
    } catch (error) {
        console.error('POST /api/banners error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
