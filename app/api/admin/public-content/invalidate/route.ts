import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth';
import { UserRole } from '@/lib/constants';
import { invalidatePublicContentCache } from '@/lib/cache/contentCache';

export async function POST(_request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        await invalidatePublicContentCache();
        return NextResponse.json({ success: true, message: 'Public content cache invalidated' });
    } catch (error) {
        console.error('[Admin public-content invalidation POST]', error);
        return NextResponse.json({ success: false, error: 'Failed to invalidate public content cache' }, { status: 500 });
    }
}
