/**
 * Client-side Data Fetchers
 *
 * These functions can be used in client components to fetch data
 * They call API routes which handle environment-aware data fetching
 */

import {
    mockBanners,
    mockProducts,
    mockVendors,
    mockOrders,
    mockReviews,
    mockUsers,
} from './mockData';

// Enable mock data only when explicitly opted in (e.g., during local dev when backend is not available)
const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// ==================== BANNERS ====================

export async function getBannersClient() {
    try {
        const res = await fetch('/api/banners?active=true');
        if (!res.ok) return useMockData ? mockBanners : [];

        const data = await res.json();
        return data?.banners ?? (useMockData ? mockBanners : []);
    } catch (err) {
        console.error('getBannersClient error', err);
        return useMockData ? mockBanners : [];
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
        const list = data?.products ?? (useMockData ? mockProducts : []);
        return Array.isArray(list) ? list.slice(0, limit) : [];
    } catch (err) {
        console.error('getProductsClient error', err);
        return useMockData ? mockProducts : [];
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
        return data?.product ?? (useMockData ? mockProducts.find((p) => p.id === id) : null);
    } catch (err) {
        console.error('getProductByIdClient error', err);
        return useMockData ? mockProducts.find((p) => p.id === id) : null;
    }
}

// ==================== VENDORS ====================

export async function getVendorsClient(limit = 20) {
    try {
        const res = await fetch(`/api/vendors?status=APPROVED&limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch vendors');

        const data = await res.json();
        return data?.vendors ?? (useMockData ? mockVendors : []);
    } catch (err) {
        console.error('getVendorsClient error', err);
        return useMockData ? mockVendors : [];
    }
}

export async function getVendorByIdClient(id: string) {
    try {
        const res = await fetch(`/api/vendors/${id}`);
        if (!res.ok) {
            return null;
        }

        const data = await res.json();
        return data?.vendor ?? (useMockData ? mockVendors.find((v) => v.id === id) : null);
    } catch (err) {
        console.error('getVendorByIdClient error', err);
        return useMockData ? mockVendors.find((v) => v.id === id) : null;
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
        return data?.orders ?? (useMockData ? mockOrders : []);
    } catch (err) {
        console.error('getOrdersClient error', err);
        return useMockData ? mockOrders : [];
    }
}

export async function getUsersClient() {
    try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch users');

        const data = await res.json();
        return data?.data ?? (useMockData ? mockUsers : []);
    } catch (err) {
        console.error('getUsersClient error', err);
        return useMockData ? mockUsers : [];
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
        return data?.reviews ?? (useMockData ? mockReviews.filter((r) => r.productId === productId) : []);
    } catch (err) {
        console.error('getReviewsByProductIdClient error', err);
        return useMockData ? mockReviews.filter((r) => r.productId === productId) : [];
    }
}
