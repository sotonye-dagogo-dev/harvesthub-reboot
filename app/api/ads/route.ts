/**
 * POST /api/ads — Submit a new advertisement
 * GET  /api/ads/active and /api/ads/my-ads are separate routes
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { title, subtitle, ctaText, ctaLink, imageUrl, imagePublicId, dailyRate, startDate, duration } = body;

        if (!title || !imageUrl || !dailyRate || !startDate || !duration) {
            return NextResponse.json({ error: 'title, imageUrl, dailyRate, startDate, and duration are required' }, { status: 400 });
        }
        if (typeof dailyRate !== 'number' || dailyRate <= 0) {
            return NextResponse.json({ error: 'dailyRate must be a positive number' }, { status: 400 });
        }
        if (typeof duration !== 'number' || duration < 1 || !Number.isInteger(duration)) {
            return NextResponse.json({ error: 'duration must be a positive integer (days)' }, { status: 400 });
        }

        const parsedStart = new Date(startDate);
        if (isNaN(parsedStart.getTime())) {
            return NextResponse.json({ error: 'startDate must be a valid date' }, { status: 400 });
        }

        const endDate = new Date(parsedStart);
        endDate.setDate(endDate.getDate() + duration);

        const ad = await prisma.advertisement.create({
            data: {
                advertiserId: user.userId,
                title,
                subtitle: subtitle ?? null,
                ctaText: ctaText ?? null,
                ctaLink: ctaLink ?? null,
                imageUrl,
                imagePublicId: imagePublicId ?? null,
                dailyRate,
                startDate: parsedStart,
                endDate,
                totalPaid: 0,
            },
        });

        return NextResponse.json({ success: true, ad }, { status: 201 });
    } catch (error) {
        console.error('POST /api/ads error:', error);
        return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 });
    }
}
