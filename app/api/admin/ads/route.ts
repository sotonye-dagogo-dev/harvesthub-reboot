import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth';
import { UserRole } from '@/lib/constants';
import { adDb } from '@/lib/data/adStore';
import type { AdStatus } from '@/lib/types';

// GET /api/admin/ads - List all ads with filters (admin only)
export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as AdStatus | null;
        const userId = searchParams.get('userId') || undefined;

        const filters: { status?: AdStatus; userId?: string } = {};
        if (status) filters.status = status;
        if (userId) filters.userId = userId;

        const ads = adDb.findAll(filters);

        return NextResponse.json({ success: true, ads });
    } catch (error) {
        console.error('Admin get ads error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch ads' },
            { status: 500 }
        );
    }
}
