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

let _cachedMockData: { publicContent: PublicContentItem[] } | null = null;

async function loadMockData() {
    if (_cachedMockData) return _cachedMockData;
    try {
        const m = await import('./mockData.dev');
        _cachedMockData = { publicContent: (m as any).mockPublicContent ?? [] };
        return _cachedMockData;
    } catch {
        return null;
    }
}

function isMockDataEnabled() {
    return (
        process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
        (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false')
    );
}

export async function getPublicContentBySlug(slug: string): Promise<PublicContentItem | null> {
    if (isMockDataEnabled()) {
        const mock = await loadMockData();
        return mock?.publicContent.find((item) => item.slug === slug) ?? null;
    }

    const cached = await getCachedPublicContentBySlug(slug);
    if (cached) {
        return cached as PublicContentItem;
    }

    const content = await (prisma as any).publicContent.findUnique({
        where: { slug },
    });

    if (!content) return null;

    await setCachedPublicContentBySlug(slug, content as unknown as Record<string, unknown>);
    return content as PublicContentItem;
}

export async function listPublicContent(status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    if (isMockDataEnabled()) {
        const mock = await loadMockData();
        const list = mock?.publicContent ?? [];
        return status ? list.filter((item) => item.status === status) : list;
    }

    const content = await (prisma as any).publicContent.findMany({
        where: status ? { status } : {},
        orderBy: { createdAt: 'desc' },
    });

    await setCachedPublicContentList(content as unknown as Record<string, unknown>[]);
    return content as PublicContentItem[];
}

export async function upsertPublicContent(data: {
    slug: string;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}) {
    if (isMockDataEnabled()) {
        const existing = await getPublicContentBySlug(data.slug);
        if (existing) {
            const updated = { ...existing, ...data, updatedAt: new Date() };
            const mock = await loadMockData();
            if (!mock) throw new Error('Mock data not available');
            mock.publicContent = mock.publicContent.map((item) => (item.slug === data.slug ? updated : item));
            return updated;
        }

        const newItem: PublicContentItem = {
            id: `mock-${Date.now()}`,
            ...data,
            status: data.status ?? 'PUBLISHED',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const mock = await loadMockData();
        if (!mock) throw new Error('Mock data not available');
        mock.publicContent.push(newItem);
        return newItem;
    }

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
    if (isMockDataEnabled()) {
        const mock = await loadMockData();
        if (!mock) return null;
        const item = mock.publicContent.find((content) => content.slug === slug) ?? null;
        mock.publicContent = mock.publicContent.filter((content) => content.slug !== slug);
        return item;
    }

    const existing = await (prisma as any).publicContent.findUnique({ where: { slug } });
    if (!existing) return null;

    await (prisma as any).publicContent.delete({ where: { slug } });
    await invalidatePublicContentCache();
    return existing as PublicContentItem;
}
