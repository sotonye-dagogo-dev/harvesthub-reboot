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
import {
    mockBanners,
    mockProducts,
    mockVendors,
    mockOrders,
    mockUsers,
    mockReviews,
    mockWallets,
    mockTransactions,
    mockAddresses,
} from './mockData';

// ==================== ENVIRONMENT CHECKS ====================

const isDevelopment = process.env.NODE_ENV === 'development';

// ==================== BANNERS ====================

export async function getBanners(): Promise<Banner[]> {
    if (isDevelopment) {
        return mockBanners;
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
        return mockBanners;
    }
}

export async function getHeroBanners(): Promise<Banner[]> {
    if (isDevelopment) {
        return mockBanners.filter((b) => b.position === 'HERO' && b.isActive);
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
        return mockBanners.filter((b) => b.position === 'HERO');
    }
}

// ==================== PRODUCTS ====================

export async function getProducts(): Promise<Product[]> {
    if (isDevelopment) {
        return mockProducts;
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
        return mockProducts;
    }
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
    if (isDevelopment) {
        return mockProducts.filter((p) => p.isFeatured && p.isActive).slice(0, limit);
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
        return mockProducts.filter((p) => p.isFeatured && p.isActive).slice(0, limit);
    }
}

export async function getTrendingProducts(limit = 8): Promise<Product[]> {
    if (isDevelopment) {
        return mockProducts
            .filter((p) => p.isActive)
            .sort((a, b) => (b.reviews?.length ?? 0) - (a.reviews?.length ?? 0))
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
        return mockProducts
            .filter((p) => p.isActive)
            .sort((a, b) => (b.reviews?.length ?? 0) - (a.reviews?.length ?? 0))
            .slice(0, limit);
    }
}

export async function getProductById(id: string) {
    if (isDevelopment) {
        return mockProducts.find((p) => p.id === id);
    }

    try {
        return await prisma.product
            .findUnique({
                where: { id },
                include: {
                    vendor: true,
                    reviews: true,
                },
            })
            .catch(() => mockProducts.find((p) => p.id === id));
    } catch {
        return mockProducts.find((p) => p.id === id);
    }
}

// ==================== VENDORS ====================

export async function getVendors(): Promise<Vendor[]> {
    if (isDevelopment) {
        return mockVendors;
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
        return mockVendors;
    }
}

export async function getVendorById(id: string) {
    if (isDevelopment) {
        return mockVendors.find((v) => v.id === id);
    }

    try {
        return await prisma.vendor
            .findUnique({
                where: { id },
                include: {
                    user: true,
                    products: true,
                },
            })
            .catch(() => mockVendors.find((v) => v.id === id));
    } catch {
        return mockVendors.find((v) => v.id === id);
    }
}

export async function getVendorByUserId(userId: string) {
    if (isDevelopment) {
        return mockVendors.find((v) => v.userId === userId);
    }

    try {
        return await prisma.vendor
            .findUnique({
                where: { userId },
                include: {
                    user: true,
                    products: true,
                },
            })
            .catch(() => mockVendors.find((v) => v.userId === userId));
    } catch {
        return mockVendors.find((v) => v.userId === userId);
    }
}

// ==================== ORDERS ====================

export async function getOrders(): Promise<Order[]> {
    if (isDevelopment) {
        return mockOrders;
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
        return mockOrders;
    }
}

export async function getOrderById(id: string) {
    if (isDevelopment) {
        return mockOrders.find((o) => o.id === id);
    }

    try {
        return await prisma.order
            .findUnique({
                where: { id },
                include: {
                    buyer: { include: { user: true } },
                    vendor: { include: { user: true } },
                    items: { include: { product: true } },
                },
            })
            .catch(() => mockOrders.find((o) => o.id === id));
    } catch {
        return mockOrders.find((o) => o.id === id);
    }
}

export async function getOrdersByBuyerId(buyerId: string): Promise<Order[]> {
    if (isDevelopment) {
        return mockOrders.filter((o) => o.buyerId === buyerId);
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
        return mockOrders.filter((o) => o.buyerId === buyerId);
    }
}

export async function getOrdersByVendorId(vendorId: string) {
    if (isDevelopment) {
        return mockOrders.filter((o) => o.vendorId === vendorId);
    }

    try {
        return await prisma.order
            .findMany({
                where: { vendorId },
                include: {
                    buyer: { include: { user: true } },
                    items: { include: { product: true } },
                },
                orderBy: { createdAt: 'desc' },
            })
            .catch(() => mockOrders.filter((o) => o.vendorId === vendorId));
    } catch {
        return mockOrders.filter((o) => o.vendorId === vendorId);
    }
}

// ==================== USERS ====================

export async function getUsers() {
    if (isDevelopment) {
        return mockUsers;
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
        return mockUsers;
    }
}

export async function getUserById(id: string) {
    if (isDevelopment) {
        return mockUsers.find((u) => u.id === id);
    }

    try {
        const user = await prisma.user
            .findUnique({
                where: { id },
            });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return user as any;
    } catch {
        return mockUsers.find((u) => u.id === id);
    }
}

// ==================== REVIEWS ====================

export async function getReviews() {
    if (isDevelopment) {
        return mockReviews;
    }

    try {
        return await prisma.review
            .findMany({
                include: {
                    product: true,
                },
                orderBy: { createdAt: 'desc' },
            })
            .catch(() => mockReviews);
    } catch {
        return mockReviews;
    }
}

export async function getReviewsByProductId(productId: string) {
    if (isDevelopment) {
        return mockReviews.filter((r) => r.productId === productId);
    }

    try {
        return await prisma.review
            .findMany({
                where: { productId },
                orderBy: { createdAt: 'desc' },
            })
            .catch(() => mockReviews.filter((r) => r.productId === productId));
    } catch {
        return mockReviews.filter((r) => r.productId === productId);
    }
}

// ==================== WALLETS ====================

export async function getWallets() {
    if (isDevelopment) {
        return mockWallets;
    }

    try {
        return await prisma.wallet
            .findMany({
                include: { user: true },
            })
            .catch(() => mockWallets);
    } catch {
        return mockWallets;
    }
}

export async function getWalletByUserId(userId: string) {
    if (isDevelopment) {
        return mockWallets.find((w) => w.userId === userId);
    }

    try {
        return await prisma.wallet
            .findUnique({
                where: { userId },
                include: { transactions: true },
            })
            .catch(() => mockWallets.find((w) => w.userId === userId));
    } catch {
        return mockWallets.find((w) => w.userId === userId);
    }
}

// ==================== TRANSACTIONS ====================

export async function getTransactions() {
    if (isDevelopment) {
        return mockTransactions;
    }

    try {
        return await prisma.transaction
            .findMany({
                include: { wallet: true },
                orderBy: { createdAt: 'desc' },
            })
            .catch(() => mockTransactions);
    } catch {
        return mockTransactions;
    }
}

export async function getTransactionsByWalletId(walletId: string) {
    if (isDevelopment) {
        return mockTransactions.filter((t) => t.walletId === walletId);
    }

    try {
        return await prisma.transaction
            .findMany({
                where: { walletId },
                orderBy: { createdAt: 'desc' },
            })
            .catch(() => mockTransactions.filter((t) => t.walletId === walletId));
    } catch {
        return mockTransactions.filter((t) => t.walletId === walletId);
    }
}

// ==================== ADDRESSES ====================

export async function getAddresses() {
    if (isDevelopment) {
        return mockAddresses;
    }

    try {
        return await prisma.address
            .findMany({
                include: { user: true },
                orderBy: { createdAt: 'desc' },
            })
            .catch(() => mockAddresses);
    } catch {
        return mockAddresses;
    }
}

export async function getAddressesByUserId(userId: string) {
    if (isDevelopment) {
        return mockAddresses.filter((a) => a.userId === userId);
    }

    try {
        return await prisma.address
            .findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            })
            .catch(() => mockAddresses.filter((a) => a.userId === userId));
    } catch {
        return mockAddresses.filter((a) => a.userId === userId);
    }
}
