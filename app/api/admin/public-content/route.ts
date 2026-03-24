import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth';
import { UserRole } from '@/lib/constants';
import { listPublicContent, upsertPublicContent, deletePublicContent } from '@/lib/data/publicContent';

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const url = new URL(request.url);
        const status = url.searchParams.get('status') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | null;

        const content = await listPublicContent(status ?? undefined);
        return NextResponse.json({ success: true, data: content });
    } catch (error) {
        console.error('[Admin public-content GET]', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch public content' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { slug, title, body: contentBody, metadata, status } = body;

        if (!slug || !title || !contentBody) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const saved = await upsertPublicContent({
            slug,
            title,
            body: contentBody,
            metadata,
            status,
        });

        return NextResponse.json({ success: true, data: saved });
    } catch (error) {
        console.error('[Admin public-content POST]', error);
        return NextResponse.json({ success: false, error: 'Failed to upsert public content' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const url = new URL(request.url);
        const slug = url.searchParams.get('slug');
        if (!slug) {
            return NextResponse.json({ success: false, error: 'Missing slug query parameter' }, { status: 400 });
        }

        const removed = await deletePublicContent(slug);
        if (!removed) {
            return NextResponse.json({ success: false, error: 'Public content not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: removed });
    } catch (error) {
        console.error('[Admin public-content DELETE]', error);
        return NextResponse.json({ success: false, error: 'Failed to delete public content' }, { status: 500 });
    }
}
