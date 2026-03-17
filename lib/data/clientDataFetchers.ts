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
} from './mockData';

// ==================== BANNERS ====================

export async function getBannersClient() {
    try {
        const res = await fetch('/api/banners?active=true');

        const data = await res.json();
        return data.data || (process.env.NODE_ENV === 'production' ? [] : mockBanners);
    } catch {
        return process.env.NODE_ENV === 'production' ? [] : mockBanners;
    }
}

// ==================== PRODUCTS ====================

export async function getProductsClient(filters?: {
    isFeatured?: boolean;
    category?: string;
    search?: string;
    limit?: number;
}) {
    try {
        const params = new URLSearchParams({
            isActive: 'true',
            limit: (filters?.limit || 20).toString(),
        });

        if (filters?.isFeatured) params.append('isFeatured', 'true');
        if (filters?.category) params.append('category', filters.category);
        if (filters?.search) params.append('search', filters.search);

        const res = await fetch(`/api/products?${params.toString()}`);

        const data = await res.json();
        return data.data || (process.env.NODE_ENV === 'production' ? [] : mockProducts);
    } catch {
        return process.env.NODE_ENV === 'production' ? [] : mockProducts;
    }
}

export async function getFeaturedProductsClient(limit = 8) {
    try {
        const res = await fetch(`/api/products?isFeatured=true&limit=${limit}`);

        const data = await res.json();
        const list = data.data || (process.env.NODE_ENV === 'production' ? [] : mockProducts);
        return list.slice(0, limit);
    } catch {
        return process.env.NODE_ENV === 'production'
            ? []
            : mockProducts.filter((p) => p.isFeatured && p.isActive).slice(0, limit);
    }
}

export async function getProductByIdClient(id: string) {
    try {
        const res = await fetch(`/api/products/${id}`);

        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        return data.data || (process.env.NODE_ENV === 'production' ? null : mockProducts.find((p) => p.id === id));
    } catch {
        return process.env.NODE_ENV === 'production' ? null : mockProducts.find((p) => p.id === id);
    }
}

// ==================== VENDORS ====================

export async function getVendorsClient(limit = 20) {
    try {
        const res = await fetch(`/api/vendors?status=APPROVED&limit=${limit}`);

        const data = await res.json();
        return data.data || (process.env.NODE_ENV === 'production' ? [] : mockVendors);
    } catch {
        return process.env.NODE_ENV === 'production' ? [] : mockVendors;
    }
}

export async function getVendorByIdClient(id: string) {
    try {
        const res = await fetch(`/api/vendors/${id}`);

        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        return data.data || (process.env.NODE_ENV === 'production' ? null : mockVendors.find((v) => v.id === id));
    } catch {
        return process.env.NODE_ENV === 'production' ? null : mockVendors.find((v) => v.id === id);
    }
}

// ==================== ORDERS ====================

export async function getOrdersClient() {
    try {
        const res = await fetch('/api/orders', {
            cache: 'no-store', // Orders should not be cached
        });

        const data = await res.json();
        return data.data || (process.env.NODE_ENV === 'production' ? [] : mockOrders);
    } catch {
        return process.env.NODE_ENV === 'production' ? [] : mockOrders;
    }
}

export async function getOrderByIdClient(id: string) {
    try {
        const res = await fetch(`/api/orders/${id}`, {
            cache: 'no-store',
        });

        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        return data.data || (process.env.NODE_ENV === 'production' ? null : mockOrders.find((o) => o.id === id));
    } catch {
        return process.env.NODE_ENV === 'production' ? null : mockOrders.find((o) => o.id === id);
    }
}

// ==================== REVIEWS ====================

export async function getReviewsByProductIdClient(productId: string) {
    try {
        const res = await fetch(`/api/reviews?productId=${productId}`);

        const data = await res.json();
        return data.data || (process.env.NODE_ENV === 'production' ? [] : mockReviews.filter((r) => r.productId === productId));
    } catch {
        return process.env.NODE_ENV === 'production' ? [] : mockReviews.filter((r) => r.productId === productId);
    }
}
