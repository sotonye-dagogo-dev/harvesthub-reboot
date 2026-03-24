import { describe, expect, it, beforeEach } from 'vitest';
import { getPublicContentBySlug, upsertPublicContent, deletePublicContent, listPublicContent } from '@/lib/data/publicContent';

describe('publicContent data layer', () => {
    beforeEach(() => {
        process.env.NEXT_PUBLIC_USE_MOCK_DATA = 'true';
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
