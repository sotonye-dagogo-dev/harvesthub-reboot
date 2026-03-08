import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth';
import { adDb } from '@/lib/data/adStore';

// GET /api/ads/[id] - Get ad details
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const ad = adDb.findById(id);

        if (!ad) {
            return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
        }

        // Only the ad owner or an admin can view ad details
        if (ad.userId !== currentUser.userId && currentUser.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ success: true, ad });
    } catch (error) {
        console.error('Get ad error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch ad' },
            { status: 500 }
        );
    }
}
