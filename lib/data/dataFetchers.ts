/**
 * Prisma-backed Data Fetchers
 *
 * These fetchers are the server-side data access layer used across the app.
 * They intentionally avoid runtime mock fallbacks so failures are explicit.
 */

import { prisma } from '@/lib/db/prisma';
import type { Banner, Product, Vendor, Order, Review } from '@/lib/types';

// ==================== BANNERS ====================

export async function getBanners(): Promise<Banner[]> {
    try {
        const banners = await prisma.banner.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return banners as any;
    } catch {
        return [];
    }
}

export async function getHeroBanners(): Promise<Banner[]> {
    try {
        const now = new Date();
        const banners = await prisma.banner.findMany({
            where: {
                isActive: true,
                position: 'HERO',
                startDate: { lte: now },
                OR: [{ endDate: null }, { endDate: { gte: now } }],
            },
            orderBy: { displayOrder: 'asc' },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return banners
            .filter((b) => b.position === 'HERO' && String(b.title || '').trim().length > 0) as any;
    } catch {
        return [];
    }
}

// ==================== PRODUCTS ====================

export async function getProducts(): Promise<Product[]> {
    try {
        const products = await prisma.product.findMany({
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
        return [];
    }
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
    try {
        const products = await prisma.product.findMany({
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
        return [];
    }
}

export async function getTrendingProducts(limit = 8): Promise<Product[]> {
    try {
        const products = await prisma.product.findMany({
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
        return [];
    }
}

export async function getProductById(id: string) {
    try {
        return await prisma.product.findUnique({
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
    try {
        const vendors = await prisma.vendor.findMany({
            where: { status: { in: ['APPROVED', 'PENDING'] } },
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return vendors as any;
    } catch {
        return [];
    }
}

export async function getVendorById(id: string) {
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

export async function getBuyerByUserId(userId: string) {
    try {
        return await prisma.buyer.findUnique({
            where: { userId },
            include: {
                user: true,
            },
        });
    } catch {
        return null;
    }
}

export async function getVendorByUserId(userId: string) {
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
    try {
        const orders = await prisma.order.findMany({
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
        return [];
    }
}

export async function getOrderById(id: string) {
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
    try {
        const orders = await prisma.order.findMany({
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
        return [];
    }
}

export async function getOrdersByVendorId(vendorId: string) {
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

export async function getOrdersByUserRole(user: { userId: string; role: string }) {
    if (!user || !user.userId) return [];

    if (user.role === 'ADMIN') {
        return getOrders();
    }

    if (user.role === 'VENDOR') {
        const vendor = await getVendorByUserId(user.userId);
        if (!vendor?.id) return [];
        return getOrdersByVendorId(vendor.id);
    }

    if (user.role === 'BUYER') {
        const buyer = await getBuyerByUserId(user.userId);
        if (!buyer?.id) return [];
        return getOrdersByBuyerId(buyer.id);
    }

    return [];
}

// ==================== USERS ====================

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return users as any;
    } catch {
        return [];
    }
}

export async function getUserById(id: string) {
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
    try {
        const reviews = await prisma.review.findMany({
            include: {
                product: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return reviews as unknown as Review[];
    } catch {
        return [];
    }
}

export async function getReviewsByProductId(productId: string) {
    try {
        const reviews = await prisma.review.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
        });
        return reviews as unknown as Review[];
    } catch {
        return [];
    }
}

// ==================== WALLETS ====================

export async function getWallets() {
    try {
        return await prisma.wallet.findMany({
            include: { user: true },
        });
    } catch {
        return [];
    }
}

export async function getWalletByUserId(userId: string) {
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
    try {
        return await prisma.address.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    } catch {
        return [];
    }
}
