import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/database';
import { getCurrentUser } from '@/lib/utils/auth';
import { rateLimitByUser, getRateLimitResponse } from '@/lib/middleware/rate-limit';
import { UserRole } from '@/lib/constants';

export async function GET() {
    try {
        const rateConfig = await db.adRateConfig.getActive();
        if (!rateConfig) {
            return NextResponse.json({ success: false, error: 'Rate config not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, rateConfig });
    } catch (error) {
        console.error('GET /api/admin/ads/rates error:', error);
        return NextResponse.json({ success: false, error: 'Failed to retrieve rate config' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const rl = await rateLimitByUser(user.userId);
        if (!rl.success) return getRateLimitResponse(rl);

        const body = await req.json();
        const { hourlyRate, dailyRate, isActive } = body;

        if (typeof hourlyRate !== 'number' || typeof dailyRate !== 'number') {
            return NextResponse.json({ error: 'Invalid rate values' }, { status: 400 });
        }

        const activeConfig = await db.adRateConfig.getActive();
        if (!activeConfig) {
            return NextResponse.json({ error: 'No active rate config found' }, { status: 404 });
        }

        const updated = await db.adRateConfig.update(activeConfig.id, {
            hourlyRate,
            dailyRate,
            isActive: isActive !== undefined ? isActive : true,
        });

        return NextResponse.json({ success: true, rateConfig: updated });
    } catch (error) {
        console.error('PUT /api/admin/ads/rates error:', error);
        return NextResponse.json({ error: 'Failed to update rate config' }, { status: 500 });
    }
}
