import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostBySlug } from '@/lib/data/blog';

export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await context.params;
        if (!slug) {
            return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 });
        }

        const post = await getBlogPostBySlug(slug);
        if (!post || post.status !== 'PUBLISHED') {
            return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: post });
    } catch (error) {
        console.error('[Blog post GET]', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch blog post' }, { status: 500 });
    }
}
