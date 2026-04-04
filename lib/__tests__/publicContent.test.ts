import { beforeEach, describe, expect, it, vi } from 'vitest';

type MockPublicContentItem = {
    id: string;
    slug: string;
    title: string;
    body: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
};

const store = new Map<string, MockPublicContentItem>();
const cacheBySlug = new Map<string, Record<string, unknown>>();

vi.mock('@/lib/db/prisma', () => ({
    prisma: {
        publicContent: {
            findUnique: vi.fn(async ({ where }: { where: { slug: string } }) => {
                return store.get(where.slug) ?? null;
            }),
            findMany: vi.fn(
                async ({ where }: { where?: { status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' } }) => {
                    const all = Array.from(store.values());
                    const filtered = where?.status
                        ? all.filter((item) => item.status === where.status)
                        : all;
                    return filtered.sort(
                        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
                    );
                }
            ),
            upsert: vi.fn(
                async ({
                    where,
                    create,
                    update,
                }: {
                    where: { slug: string };
                    create: Omit<MockPublicContentItem, 'id' | 'createdAt' | 'updatedAt'>;
                    update: Partial<Omit<MockPublicContentItem, 'id' | 'slug' | 'createdAt'>>;
                }) => {
                    const existing = store.get(where.slug);
                    if (existing) {
                        const updated: MockPublicContentItem = {
                            ...existing,
                            ...update,
                            updatedAt: new Date(),
                        };
                        store.set(where.slug, updated);
                        return updated;
                    }

                    const now = new Date();
                    const created: MockPublicContentItem = {
                        id: `pc-${store.size + 1}`,
                        ...create,
                        createdAt: now,
                        updatedAt: now,
                    };
                    store.set(where.slug, created);
                    return created;
                }
            ),
            delete: vi.fn(async ({ where }: { where: { slug: string } }) => {
                const existing = store.get(where.slug) ?? null;
                store.delete(where.slug);
                return existing;
            }),
        },
    },
}));

vi.mock('@/lib/cache/contentCache', () => ({
    getCachedPublicContentBySlug: vi.fn(async (slug: string) => cacheBySlug.get(slug) ?? null),
    setCachedPublicContentBySlug: vi.fn(async (slug: string, content: Record<string, unknown>) => {
        cacheBySlug.set(slug, content);
    }),
    setCachedPublicContentList: vi.fn(async () => undefined),
    invalidatePublicContentCache: vi.fn(async () => {
        cacheBySlug.clear();
    }),
}));

import {
    deletePublicContent,
    getPublicContentBySlug,
    listPublicContent,
    upsertPublicContent,
} from '@/lib/data/publicContent';

describe('publicContent data layer', () => {
    beforeEach(() => {
        store.clear();
        cacheBySlug.clear();
        vi.clearAllMocks();
    });

    it('can create and fetch a public content item by slug', async () => {
        const slug = `test-terms-${Date.now()}`;
        const created = await upsertPublicContent({
            slug,
            title: 'Test Terms',
            body: '<p>Test content</p>',
            status: 'PUBLISHED',
        });

        expect(created).toMatchObject({ slug, title: 'Test Terms', status: 'PUBLISHED' });

        const loaded = await getPublicContentBySlug(slug);
        expect(loaded).not.toBeNull();
        expect(loaded?.body).toBe('<p>Test content</p>');
    });

    it('can list and delete public content', async () => {
        const slug = `test-delete-${Date.now()}`;
        await upsertPublicContent({
            slug,
            title: 'Delete Me',
            body: '<p>Should be deleted</p>',
            status: 'DRAFT',
        });

        const all = await listPublicContent();
        expect(all.some((item) => item.slug === slug)).toBe(true);

        const removed = await deletePublicContent(slug);
        expect(removed).not.toBeNull();
        expect(removed?.slug).toBe(slug);

        const afterDelete = await getPublicContentBySlug(slug);
        expect(afterDelete).toBeNull();
    });
});
