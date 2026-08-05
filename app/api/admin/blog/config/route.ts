import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth';
import { UserRole } from '@/lib/constants';
import { getBlogConfig, upsertBlogConfig } from '@/lib/data/blog';
import { BLOG_DEFAULTS } from '@/lib/config/blog';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const config = await getBlogConfig();
        return NextResponse.json({ success: true, data: config, defaults: BLOG_DEFAULTS });
    } catch (error) {
        console.error('[Admin blog config GET]', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch blog config' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const allowed = [
            'title',
            'description',
            'heroHeading',
            'heroSubtitle',
            'seoTitle',
            'seoDescription',
            'seoKeywords',
            'postsPerPage',
            'showAuthor',
            'showReadTime',
            'showShareButtons',
            'showFeaturedPost',
            'defaultAuthorName',
            'defaultCoverImage',
            'suggestedCategories',
        ] as const;

        const patch: Record<string, unknown> = {};
        for (const key of allowed) {
            if (body[key] !== undefined) {
                patch[key] = body[key];
            }
        }

        const saved = await upsertBlogConfig(patch);
        return NextResponse.json({ success: true, data: saved });
    } catch (error) {
        console.error('[Admin blog config PUT]', error);
        return NextResponse.json({ success: false, error: 'Failed to update blog config' }, { status: 500 });
    }
}
