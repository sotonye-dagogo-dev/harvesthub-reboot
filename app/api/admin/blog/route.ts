import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth';
import { UserRole } from '@/lib/constants';
import { listBlogPosts, upsertBlogPost } from '@/lib/data/blog';
import { BLOG_STATUSES, type BlogStatusValue } from '@/lib/config/blog';

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const url = new URL(request.url);
        const rawStatus = url.searchParams.get('status');

        let status: BlogStatusValue | undefined;
        if (rawStatus) {
            const normalized = rawStatus.toUpperCase() as BlogStatusValue;
            if (!BLOG_STATUSES.includes(normalized)) {
                return NextResponse.json({ success: false, error: 'Invalid status filter' }, { status: 400 });
            }
            status = normalized;
        }

        const result = await listBlogPosts({ status });
        return NextResponse.json({ success: true, data: result.posts, total: result.total });
    } catch (error) {
        console.error('[Admin blog GET]', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch blog posts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const {
            slug,
            title,
            excerpt,
            body: contentBody,
            coverImage,
            authorName,
            authorRole,
            category,
            tags,
            status: rawStatus,
            featured,
            publishedAt,
            seoTitle,
            seoDescription,
            seoKeywords,
            metadata,
        } = body;

        if (!slug || !title || !contentBody || !authorName) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const status = (rawStatus ?? 'DRAFT').toUpperCase();
        if (!BLOG_STATUSES.includes(status as BlogStatusValue)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }

        const saved = await upsertBlogPost({
            slug,
            title,
            excerpt: excerpt ?? null,
            body: contentBody,
            coverImage: coverImage ?? null,
            authorName,
            authorRole: authorRole ?? null,
            category: category ?? null,
            tags: Array.isArray(tags) ? tags.map(String) : [],
            status: status as BlogStatusValue,
            featured: Boolean(featured),
            publishedAt: publishedAt ?? null,
            seoTitle: seoTitle ?? null,
            seoDescription: seoDescription ?? null,
            seoKeywords: seoKeywords ?? null,
            metadata: metadata ?? {},
        });

        return NextResponse.json({ success: true, data: saved });
    } catch (error) {
        console.error('[Admin blog POST]', error);
        return NextResponse.json({ success: false, error: 'Failed to upsert blog post' }, { status: 500 });
    }
}
