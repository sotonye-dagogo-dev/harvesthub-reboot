import { NextRequest, NextResponse } from 'next/server';
import { getPublicContentBySlug } from '@/lib/data/publicContent';

export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await context.params;
        if (!slug) {
            return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 });
        }

        const content = await getPublicContentBySlug(slug);
        if (!content || content.status !== 'PUBLISHED') {
            return NextResponse.json({ success: false, error: 'Content not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: content });
    } catch (error) {
        console.error('[Public content GET]', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch public content' }, { status: 500 });
    }
}
