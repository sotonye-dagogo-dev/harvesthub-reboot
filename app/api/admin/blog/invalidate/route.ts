import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth';
import { UserRole } from '@/lib/constants';
import { invalidateBlogCache } from '@/lib/cache/blogCache';

export async function POST() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        await invalidateBlogCache();
        return NextResponse.json({ success: true, message: 'Blog cache invalidated' });
    } catch (error) {
        console.error('[Admin blog invalidate]', error);
        return NextResponse.json({ success: false, error: 'Failed to invalidate blog cache' }, { status: 500 });
    }
}
