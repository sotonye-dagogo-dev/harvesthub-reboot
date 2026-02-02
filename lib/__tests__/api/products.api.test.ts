/**
 * Products API Integration Tests
 * Tests product CRUD operations and search functionality
 */

import { describe, it, expect } from 'vitest';

describe('Products API Integration Tests', () => {
    describe('GET /api/products', () => {
        it('should return paginated list of products', async () => {
            const response = await fetch('http://localhost:3000/api/products?page=1&limit=10');

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.products).toBeInstanceOf(Array);
            expect(data.pagination).toBeDefined();
            expect(data.pagination.page).toBe(1);
            expect(data.pagination.limit).toBe(10);
        });

        it('should filter products by category', async () => {
            const response = await fetch('http://localhost:3000/api/products?category=ELECTRONICS');

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            if (data.products.length > 0) {
                expect(data.products.every((p: { category: string }) => p.category === 'ELECTRONICS')).toBe(true);
            }
        });

        it('should filter products by price range', async () => {
            const response = await fetch('http://localhost:3000/api/products?minPrice=1000&maxPrice=5000');

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            if (data.products.length > 0) {
                expect(data.products.every((p: { price: number }) => p.price >= 1000 && p.price <= 5000)).toBe(true);
            }
        });
    });

    describe('GET /api/products/[id]', () => {
        it('should return product details for valid ID', async () => {
            // Use a known product ID from mockData
            const response = await fetch('http://localhost:3000/api/products/prod-001');

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.product).toBeDefined();
            expect(data.product.id).toBe('prod-001');
        });

        it('should return 404 for non-existent product', async () => {
            const response = await fetch('http://localhost:3000/api/products/nonexistent-id');

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.success).toBe(false);
        });
    });

    describe('GET /api/products/search', () => {
        it('should search products by name', async () => {
            const response = await fetch('http://localhost:3000/api/products/search?q=laptop');

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.products).toBeInstanceOf(Array);
        });

        it('should return empty array for no matches', async () => {
            const response = await fetch('http://localhost:3000/api/products/search?q=nonexistentproduct12345');

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.products).toEqual([]);
        });
    });

    describe('GET /api/products/trending', () => {
        it('should return trending products', async () => {
            const response = await fetch('http://localhost:3000/api/products/trending');

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.products).toBeInstanceOf(Array);
            expect(data.products.length).toBeLessThanOrEqual(10);
        });
    });

    describe('GET /api/products/featured', () => {
        it('should return featured products', async () => {
            const response = await fetch('http://localhost:3000/api/products/featured');

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.products).toBeInstanceOf(Array);
            if (data.products.length > 0) {
                expect(data.products.every((p: { isFeatured: boolean }) => p.isFeatured === true)).toBe(true);
            }
        });
    });

    describe('GET /api/products/new-arrivals', () => {
        it('should return recently added products', async () => {
            const response = await fetch('http://localhost:3000/api/products/new-arrivals');

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.products).toBeInstanceOf(Array);
            expect(data.total).toBeDefined();
            expect(data.products.length).toBeLessThanOrEqual(20);
        });
    });

    describe('GET /api/products/[id]/related', () => {
        it('should return related products for a given product', async () => {
            const response = await fetch('http://localhost:3000/api/products/prod-001/related');

            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.products).toBeInstanceOf(Array);
        });
    });
});
