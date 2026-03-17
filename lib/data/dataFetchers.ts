/**
 * Environment-aware Data Fetchers
 *
 * This module provides functions to fetch data with environment awareness:
 * - Production (NODE_ENV=production): Fetches from database via Prisma
 * - Development (NODE_ENV=development): Fetches from mock data
 *
 * These fetchers should be used as the primary data source throughout the app
 * instead of directly importing from mockData.ts
 */

import { prisma } from '@/lib/db/prisma';
import type { Banner, Product, Vendor, Order } from '@/lib/types';
// Note: mock data is loaded dynamically only when `NEXT_PUBLIC_USE_MOCK_DATA` is true.
// This avoids bundling or statically referencing mock data in production builds.
let _cachedMockData: any = null;
async function loadMockData() {
    if (_cachedMockData) return _cachedMockData;
    try {
        // dynamic import ensures mocks are only included in dev bundles when explicitly enabled
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const m = await import('./mockData');
        _cachedMockData = m;
        return m;
    } catch (err) {
        return null;
    }
}

// ==================== ENVIRONMENT CHECKS ====================

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
const isDevelopment = process.env.NODE_ENV === 'development';

// ==================== BANNERS ====================

export async function getBanners(): Promise<Banner[]> {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockBanners ?? []) as Banner[];
    }

    try {
        const banners = await prisma.banner
            .findMany({
                where: { isActive: true },
                orderBy: { displayOrder: 'asc' },
            });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return banners as any;
    } catch {
        if (useMockData) {
            const m = await loadMockData();
            return m?.mockBanners ?? [];
        }
        return [];
    }
}

export async function getHeroBanners(): Promise<Banner[]> {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockBanners ?? []).filter((b: any) => b.position === 'HERO' && b.isActive);
    }

    try {
        const banners = await prisma.banner
            .findMany({
                where: {
                    isActive: true,
                    position: 'HERO',
                },
                orderBy: { displayOrder: 'asc' },
            });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return banners.filter((b) => b.position === 'HERO') as any;
    } catch {
        if (useMockData) {
            const m = await loadMockData();
            return (m?.mockBanners ?? []).filter((b: any) => b.position === 'HERO');
        }
        return [];
    }
}

// ==================== PRODUCTS ====================

export async function getProducts(): Promise<Product[]> {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockProducts ?? []) as Product[];
    }

    try {
        const products = await prisma.product
            .findMany({
                where: { isActive: true },
                include: {
                    vendor: true,
                    reviews: true,
                },
                orderBy: { createdAt: 'desc' },
            });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return products as any;
    } catch {
        if (useMockData) {
            const m = await loadMockData();
            return m?.mockProducts ?? [];
        }
        return [];
    }
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockProducts ?? []).filter((p: any) => p.isFeatured && p.isActive).slice(0, limit);
    }

    try {
        const products = await prisma.product
            .findMany({
                where: { isFeatured: true, isActive: true },
                include: {
                    vendor: true,
                    reviews: true,
                },
                take: limit,
                orderBy: { createdAt: 'desc' },
            });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return products as any;
    } catch {
        if (useMockData) {
            const m = await loadMockData();
            return (m?.mockProducts ?? []).filter((p: any) => p.isFeatured && p.isActive).slice(0, limit);
        }
        return [];
    }
}

export async function getTrendingProducts(limit = 8): Promise<Product[]> {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockProducts ?? [])
            .filter((p: any) => p.isActive)
            .sort((a: any, b: any) => (b.reviews?.length ?? 0) - (a.reviews?.length ?? 0))
            .slice(0, limit);
    }

    try {
        const products = await prisma.product
            .findMany({
                where: { isActive: true },
                include: {
                    vendor: true,
                    _count: { select: { reviews: true } },
                    reviews: true,
                },
                take: limit,
                orderBy: { reviews: { _count: 'desc' } },
            });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return products as any;
    } catch {
        if (useMockData) {
            const m = await loadMockData();
            return (m?.mockProducts ?? [])
                .filter((p: any) => p.isActive)
                .sort((a: any, b: any) => (b.reviews?.length ?? 0) - (a.reviews?.length ?? 0))
                .slice(0, limit);
        }
        return [];
    }
}

export async function getProductById(id: string) {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockProducts ?? []).find((p: any) => p.id === id) ?? null;
    }

    try {
        return await prisma.product
            .findUnique({
                where: { id },
                include: {
                    vendor: true,
                    reviews: true,
                },
            });
    } catch {
        return null;
    }
}

// ==================== VENDORS ====================

export async function getVendors(): Promise<Vendor[]> {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockVendors ?? []) as Vendor[];
    }

    try {
        const vendors = await prisma.vendor
            .findMany({
                where: { status: 'APPROVED' },
                include: { user: true },
                orderBy: { createdAt: 'desc' },
            });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return vendors as any;
    } catch {
        if (useMockData) {
            const m = await loadMockData();
            return m?.mockVendors ?? [];
        }
        return [];
    }
}

export async function getVendorById(id: string) {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockVendors ?? []).find((v: any) => v.id === id) ?? null;
    }

    try {
        return await prisma.vendor.findUnique({
            where: { id },
            include: {
                user: true,
                products: true,
            },
        });
    } catch {
        return null;
    }
}

export async function getVendorByUserId(userId: string) {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockVendors ?? []).find((v: any) => v.userId === userId) ?? null;
    }

    try {
        return await prisma.vendor.findUnique({
            where: { userId },
            include: {
                user: true,
                products: true,
            },
        });
    } catch {
        return null;
    }
}

// ==================== ORDERS ====================

export async function getOrders(): Promise<Order[]> {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockOrders ?? []) as Order[];
    }

    try {
        const orders = await prisma.order
            .findMany({
                include: {
                    buyer: { include: { user: true } },
                    vendor: { include: { user: true } },
                    items: { include: { product: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return orders as any;
    } catch {
        if (useMockData) {
            const m = await loadMockData();
            return m?.mockOrders ?? [];
        }
        return [];
    }
}

export async function getOrderById(id: string) {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockOrders ?? []).find((o: any) => o.id === id) ?? null;
    }

    try {
        return await prisma.order.findUnique({
            where: { id },
            include: {
                buyer: { include: { user: true } },
                vendor: { include: { user: true } },
                items: { include: { product: true } },
            },
        });
    } catch {
        return null;
    }
}

export async function getOrdersByBuyerId(buyerId: string): Promise<Order[]> {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockOrders ?? []).filter((o: any) => o.buyerId === buyerId);
    }

    try {
        const orders = await prisma.order
            .findMany({
                where: { buyerId },
                include: {
                    vendor: { include: { user: true } },
                    items: { include: { product: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return orders as any;
    } catch {
        if (useMockData) {
            const m = await loadMockData();
            return (m?.mockOrders ?? []).filter((o: any) => o.buyerId === buyerId);
        }
        return [];
    }
}

export async function getOrdersByVendorId(vendorId: string) {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockOrders ?? []).filter((o: any) => o.vendorId === vendorId);
    }

    try {
        return await prisma.order.findMany({
            where: { vendorId },
            include: {
                buyer: { include: { user: true } },
                items: { include: { product: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    } catch {
        return [];
    }
}

// ==================== USERS ====================

export async function getUsers() {
    if (useMockData) {
        const m = await loadMockData();
        return m?.mockUsers ?? [];
    }

    try {
        const users = await prisma.user
            .findMany({
                where: { isActive: true },
                orderBy: { createdAt: 'desc' },
            });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return users as any;
    } catch {
        if (useMockData) {
            const m = await loadMockData();
            return m?.mockUsers ?? [];
        }
        return [];
    }
}

export async function getUserById(id: string) {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockUsers ?? []).find((u: any) => u.id === id) ?? null;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return user as any;
    } catch {
        return null;
    }
}

// ==================== REVIEWS ====================

export async function getReviews() {
    if (useMockData) {
        const m = await loadMockData();
        return m?.mockReviews ?? [];
    }

    try {
        return await prisma.review
            .findMany({
                include: {
                    product: true,
                },
                orderBy: { createdAt: 'desc' },
            });
    } catch {
        if (useMockData) {
            const m = await loadMockData();
            return m?.mockReviews ?? [];
        }
        return [];
    }
}
export async function getReviewsByProductId(productId: string) {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockReviews ?? []).filter((r: any) => r.productId === productId);
    }

    try {
        return await prisma.review
            .findMany({
                where: { productId },
                orderBy: { createdAt: 'desc' },
            });
    } catch {
        if (useMockData) {
            const m = await loadMockData();
            return (m?.mockReviews ?? []).filter((r: any) => r.productId === productId);
        }
        return [];
    }
}
// ==================== WALLETS ====================

export async function getWallets() {
    if (useMockData) {
        const m = await loadMockData();
        return m?.mockWallets ?? [];
    }

    try {
        return await prisma.wallet
            .findMany({
                include: { user: true },
            });
    } catch {
        if (useMockData) {
            const m = await loadMockData();
            return m?.mockWallets ?? [];
        }
        return [];
    }
}
export async function getWalletByUserId(userId: string) {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockWallets ?? []).find((w: any) => w.userId === userId) ?? null;
    }

    try {
        return await prisma.wallet.findUnique({
            where: { userId },
            include: { transactions: true },
        });
    } catch {
        return null;
    }
}




// ==================== TRANSACTIONS ====================

export async function getTransactions() {
    if (useMockData) {
        const m = await loadMockData();
        return m?.mockTransactions ?? [];
    }

    try {
        return await prisma.transaction.findMany({
            include: { wallet: true },
            orderBy: { createdAt: 'desc' },
        });
    } catch {
        return [];
    }
}

export async function getTransactionsByWalletId(walletId: string) {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockTransactions ?? []).filter((t: any) => t.walletId === walletId);
    }

    try {
        return await prisma.transaction.findMany({
            where: { walletId },
            orderBy: { createdAt: 'desc' },
        });
    } catch {
        return [];
    }
}

// ==================== ADDRESSES ====================

export async function getAddresses() {
    if (useMockData) {
        const m = await loadMockData();
        return m?.mockAddresses ?? [];
    }

    try {
        return await prisma.address.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
    } catch {
        return [];
    }
}

export async function getAddressesByUserId(userId: string) {
    if (useMockData) {
        const m = await loadMockData();
        return (m?.mockAddresses ?? []).filter((a: any) => a.userId === userId);
    }

    try {
        return await prisma.address.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    } catch {
        return [];
    }
}
