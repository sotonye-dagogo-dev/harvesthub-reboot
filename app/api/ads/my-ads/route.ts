import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth';
import { adDb } from '@/lib/data/adStore';

// GET /api/ads/my-ads - List authenticated user's ads
export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ads = adDb.findByUserId(currentUser.userId);

        return NextResponse.json({ success: true, ads });
    } catch (error) {
        console.error('Get my ads error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch ads' },
            { status: 500 }
        );
    }
}
