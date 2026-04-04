import { prisma } from '@/lib/db/prisma';
import { getCachedPublicContentBySlug, invalidatePublicContentCache, setCachedPublicContentBySlug, setCachedPublicContentList } from '@/lib/cache/contentCache';

type PublicContentItem = {
    id: string;
    slug: string;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    createdAt: Date;
    updatedAt: Date;
};

export async function getPublicContentBySlug(slug: string): Promise<PublicContentItem | null> {
    const cached = await getCachedPublicContentBySlug(slug);
    if (cached) {
        return cached as PublicContentItem;
    }

    let content;
    try {
        content = await (prisma as any).publicContent.findUnique({
            where: { slug },
        });
    } catch (error) {
        console.error('[getPublicContentBySlug] Prisma query error:', error);
        return null;
    }

    if (!content) return null;

    await setCachedPublicContentBySlug(slug, content as unknown as Record<string, unknown>);
    return content as PublicContentItem;
}

export async function listPublicContent(status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    let content;
    try {
        content = await (prisma as any).publicContent.findMany({
            where: status ? { status } : {},
            orderBy: { createdAt: 'desc' },
        });

        await setCachedPublicContentList(content as unknown as Record<string, unknown>[]);
        return content as PublicContentItem[];
    } catch (error) {
        console.error('[listPublicContent] Prisma query error:', error);
        return [];
    }
}

export async function upsertPublicContent(data: {
    slug: string;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}) {
    const saved = await (prisma as any).publicContent.upsert({
        where: { slug: data.slug },
        create: {
            slug: data.slug,
            title: data.title,
            body: data.body,
            metadata: data.metadata,
            status: data.status ?? 'PUBLISHED',
        },
        update: {
            title: data.title,
            body: data.body,
            metadata: data.metadata,
            status: data.status ?? 'PUBLISHED',
        },
    });

    await invalidatePublicContentCache();
    return saved as PublicContentItem;
}

export async function deletePublicContent(slug: string) {
    const existing = await (prisma as any).publicContent.findUnique({ where: { slug } });
    if (!existing) return null;

    await (prisma as any).publicContent.delete({ where: { slug } });
    await invalidatePublicContentCache();
    return existing as PublicContentItem;
}
