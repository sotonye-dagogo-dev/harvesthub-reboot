import { NextRequest, NextResponse } from 'next/server';
import { listBlogPosts } from '@/lib/data/blog';
import { BLOG_ROUTES } from '@/lib/config/blog';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const rawLimit = url.searchParams.get('limit');
        const rawOffset = url.searchParams.get('offset');

        const limit = rawLimit && Number.isFinite(Number(rawLimit)) ? Number(rawLimit) : undefined;
        const offset = rawOffset && Number.isFinite(Number(rawOffset)) ? Number(rawOffset) : 0;

        const result = await listBlogPosts({
            status: 'PUBLISHED',
            limit,
            offset,
        });

        const posts = result.posts.map((post) => ({
            id: post.id,
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            coverImage: post.coverImage,
            authorName: post.authorName,
            category: post.category,
            tags: post.tags,
            featured: post.featured,
            publishedAt: post.publishedAt,
            url: BLOG_ROUTES.slug(post.slug),
        }));

        return NextResponse.json({ success: true, data: posts, total: result.total });
    } catch (error) {
        console.error('[Blog GET]', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch blog posts' }, { status: 500 });
    }
}
