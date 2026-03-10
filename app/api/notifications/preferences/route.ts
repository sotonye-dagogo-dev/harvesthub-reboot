/**
 * GET /api/notifications/preferences — Get notification preferences
 * PUT /api/notifications/preferences — Update notification preferences
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';

export async function GET(_req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        let prefs = await prisma.notificationPreference.findUnique({
            where: { userId: user.userId },
        });

        // Create defaults if not found
        if (!prefs) {
            prefs = await prisma.notificationPreference.create({
                data: { userId: user.userId },
            });
        }

        return NextResponse.json({ success: true, preferences: prefs });
    } catch (error) {
        console.error('GET /api/notifications/preferences error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const allowedFields = [
            'emailNotifications', 'smsNotifications', 'pushNotifications',
            'orderUpdates', 'promotions', 'vendorMessages',
        ];
        const updateData: Record<string, boolean> = {};
        for (const key of allowedFields) {
            if (typeof body[key] === 'boolean') updateData[key] = body[key];
        }

        const prefs = await prisma.notificationPreference.upsert({
            where: { userId: user.userId },
            create: { userId: user.userId, ...updateData },
            update: updateData,
        });

        return NextResponse.json({ success: true, preferences: prefs });
    } catch (error) {
        console.error('PUT /api/notifications/preferences error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
