import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth';
import { UserRole } from '@/lib/constants';
import { deleteBlogPost } from '@/lib/data/blog';

export async function DELETE(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { slug } = await context.params;
        if (!slug) {
            return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 });
        }

        const removed = await deleteBlogPost(slug);
        if (!removed) {
            return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: removed });
    } catch (error) {
        console.error('[Admin blog DELETE]', error);
        return NextResponse.json({ success: false, error: 'Failed to delete blog post' }, { status: 500 });
    }
}
