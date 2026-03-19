/**
 * Client-side Data Fetchers
 *
 * These functions can be used in client components to fetch data
 * They call API routes which handle environment-aware data fetching
 */

import type { Product, Vendor, Order, User, Review } from '@/lib/types';

// Enable mock data only when explicitly opted in (e.g., during local dev when backend is not available)
const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

let _cachedMockData: any = null;
async function loadMockData() {
    if (_cachedMockData) return _cachedMockData;
    try {
        const m = await import('./mockData.dev');
        _cachedMockData = m;
        return m;
    } catch {
        return null;
    }
}

// ==================== BANNERS ====================

export async function getBannersClient() {
    try {
        const res = await fetch('/api/banners?active=true');
        if (!res.ok) {
            const m = await loadMockData();
            return useMockData ? m?.mockBanners ?? [] : [];
        }

        const data = await res.json();
        if (data?.banners) return data.banners;
        const m = await loadMockData();
        return useMockData ? m?.mockBanners ?? [] : [];
    } catch (err) {
        console.error('getBannersClient error', err);
        const m = await loadMockData();
        return useMockData ? m?.mockBanners ?? [] : [];
    }
}

// ==================== PRODUCTS ====================

export async function getProductsClient(filters?: {
    isFeatured?: boolean;
    category?: string;
    search?: string;
    limit?: number;
}) {
    const limit = filters?.limit ?? 20;

    try {
        const params = new URLSearchParams({
            isActive: 'true',
            limit: limit.toString(),
        });

        if (filters?.isFeatured) params.append('isFeatured', 'true');
        if (filters?.category) params.append('category', filters.category);
        if (filters?.search) params.append('search', filters.search);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch products');

        const data = await res.json();
        const list = data?.products ?? null;
        if (Array.isArray(list)) return list.slice(0, limit);
        const m = await loadMockData();
        return useMockData ? (m?.mockProducts ?? []).slice(0, limit) : [];
    } catch (err) {
        console.error('getProductsClient error', err);
        const m = await loadMockData();
        return useMockData ? (m?.mockProducts ?? []).slice(0, limit) : [];
    }
}

export async function getFeaturedProductsClient(limit = 8) {
    return getProductsClient({ isFeatured: true, limit });
}

export async function getProductByIdClient(id: string) {
    try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
            return null;
        }

        const data = await res.json();
        const product = data?.product ?? null;
        if (product) return product;
        const m = await loadMockData();
        return useMockData ? m?.mockProducts.find((p: any) => p.id === id) ?? null : null;
    } catch (err) {
        console.error('getProductByIdClient error', err);
        const m = await loadMockData();
        return useMockData ? (m?.mockProducts ?? []).find((p: Product) => p.id === id) ?? null : null;
    }
}

// ==================== VENDORS ====================

export async function getVendorsClient(limit = 20) {
    try {
        const res = await fetch(`/api/vendors?status=APPROVED&limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch vendors');

        const data = await res.json();
        const vendors = data?.vendors ?? null;
        if (Array.isArray(vendors)) return vendors;
        const m = await loadMockData();
        return useMockData ? m?.mockVendors ?? [] : [];
    } catch (err) {
        console.error('getVendorsClient error', err);
        const m = await loadMockData();
        return useMockData ? m?.mockVendors ?? [] : [];
    }
}

export async function getVendorByIdClient(id: string) {
    try {
        const res = await fetch(`/api/vendors/${id}`);
        if (!res.ok) {
            return null;
        }

        const data = await res.json();
        const vendor = data?.vendor ?? null;
        if (vendor) return vendor;
        const m = await loadMockData();
        return useMockData ? (m?.mockVendors ?? []).find((v: Vendor) => v.id === id) ?? null : null;
    } catch (err) {
        console.error('getVendorByIdClient error', err);
        const m = await loadMockData();
        return useMockData ? (m?.mockVendors ?? []).find((v: Vendor) => v.id === id) ?? null : null;
    }
}

// ==================== ORDERS ====================

export async function getOrdersClient() {
    try {
        const res = await fetch('/api/orders', {
            cache: 'no-store', // Orders should not be cached
        });
        if (!res.ok) throw new Error('Failed to fetch orders');

        const data = await res.json();
        if (Array.isArray(data?.orders)) return data.orders;
        const m = await loadMockData();
        return useMockData ? m?.mockOrders ?? [] : [];
    } catch (err) {
        console.error('getOrdersClient error', err);
        const m = await loadMockData();
        return useMockData ? m?.mockOrders ?? [] : [];
    }
}

export async function getUsersClient() {
    try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch users');

        const data = await res.json();
        if (Array.isArray(data?.data)) return data.data;
        const m = await loadMockData();
        return useMockData ? m?.mockUsers ?? [] : [];
    } catch (err) {
        console.error('getUsersClient error', err);
        const m = await loadMockData();
        return useMockData ? m?.mockUsers ?? [] : [];
    }
}

export async function getOrderByIdClient(id: string) {
    try {
        const res = await fetch(`/api/orders/${id}`, {
            cache: 'no-store',
        });
        if (!res.ok) return null;

        const data = await res.json();
        return data?.order ?? null;
    } catch (err) {
        console.error('getOrderByIdClient error', err);
        return null;
    }
}

// ==================== REVIEWS ====================

export async function getReviewsByProductIdClient(productId: string) {
    try {
        const res = await fetch(`/api/reviews?productId=${productId}`);
        if (!res.ok) throw new Error('Failed to fetch reviews');

        const data = await res.json();
        if (Array.isArray(data?.reviews)) return data.reviews;
        const m = await loadMockData();
        return useMockData ? (m?.mockReviews ?? []).filter((r: Review) => r.productId === productId) : [];
    } catch (err) {
        console.error('getReviewsByProductIdClient error', err);
        const m = await loadMockData();
        return useMockData ? (m?.mockReviews ?? []).filter((r: Review) => r.productId === productId) : [];
    }
}
