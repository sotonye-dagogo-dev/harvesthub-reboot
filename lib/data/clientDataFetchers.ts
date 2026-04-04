/**
 * Client-side Data Fetchers
 *
 * These functions can be used in client components to fetch data
 * They call API routes which handle environment-aware data fetching
 */


// ==================== BANNERS ====================

export async function getBannersClient() {
    try {
        const res = await fetch('/api/banners?active=true');
        if (!res.ok) return [];

        const data = await res.json();
        if (data?.banners) return data.banners;
        return [];
    } catch (err) {
        console.error('getBannersClient error', err);
        return [];
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
        return [];
    } catch (err) {
        console.error('getProductsClient error', err);
        return [];
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
        return null;
    } catch (err) {
        console.error('getProductByIdClient error', err);
        return null;
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
        return [];
    } catch (err) {
        console.error('getVendorsClient error', err);
        return [];
    }
}

export async function applyForAdClient(application: Record<string, unknown>) {
    const res = await fetch('/api/ad-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(application),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit ad application');
    }

    return res.json();
}

export async function getAdApplicationsClient(status?: string) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`/api/ad-applications${query}`);

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch ad applications');
    }

    return res.json();
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
        return null;
    } catch (err) {
        console.error('getVendorByIdClient error', err);
        return null;
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
        return [];
    } catch (err) {
        console.error('getOrdersClient error', err);
        return [];
    }
}

export async function getUsersClient() {
    try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch users');

        const data = await res.json();
        if (Array.isArray(data?.data)) return data.data;
        return [];
    } catch (err) {
        console.error('getUsersClient error', err);
        return [];
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
        return [];
    } catch (err) {
        console.error('getReviewsByProductIdClient error', err);
        return [];
    }
}
