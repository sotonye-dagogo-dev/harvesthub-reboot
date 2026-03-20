/**
 * MyHarvestHub Mock Database Service
 * 
 * In-memory database with full CRUD operations
 * Properly typed to match lib/types.ts structure
 * Will be replaced with Prisma + PostgreSQL in production
 */

import {
    UserRole,
    OrderStatus,
    PaymentStatus,
    TransactionStatus,
    VendorStatus,
} from '@/lib/constants';

import type {
    User,
    Buyer,
    Vendor,
    Product,
    Order,
    Cart,
    CartItem,
    Wallet,
    Transaction,
    Review,
    Banner,
    Address,
} from '@/lib/types';

import {
    mockUsers,
    mockBuyers,
    mockVendors,
    mockProducts,
    mockOrders,
    mockCarts,
    mockWallets,
    mockTransactions,
    mockReviews,
    mockBanners,
    mockAddresses,
} from './mockData';

import prismaAdapter from './prismaAdapter';
import { featureFlags } from '@/lib/config';

const usePrisma = featureFlags.usePrisma;

// ===================================
// DATABASE STATE
// ===================================

let users: User[] = [...mockUsers];
let buyers: Buyer[] = [...mockBuyers];
let vendors: Vendor[] = [...mockVendors];
let products: Product[] = [...mockProducts];
let orders: Order[] = [...mockOrders];
let carts: Cart[] = [...mockCarts];
let wallets: Wallet[] = [...mockWallets];
let transactions: Transaction[] = [...mockTransactions];
let reviews: Review[] = [...mockReviews];
let banners: Banner[] = [...mockBanners];
let addresses: Address[] = [...mockAddresses];

// For password storage (separate from User type)
const passwords: Record<string, string> = {
    'user-admin-001': 'admin123',
    'user-vendor-demo': 'vendor123',
    'user-buyer-demo': 'buyer123',
    'user-vendor-001': 'vendor123',
    'user-vendor-002': 'vendor123',
    'user-vendor-003': 'vendor123',
    'user-vendor-004': 'vendor123',
    'user-vendor-005': 'vendor123',
    'user-buyer-001': 'buyer123',
    'user-buyer-002': 'buyer123',
    'user-buyer-003': 'buyer123',
    'user-buyer-004': 'buyer123',
    'user-buyer-005': 'buyer123',
    'user-buyer-006': 'buyer123',
    'user-buyer-007': 'buyer123',
    'user-buyer-008': 'buyer123',
};

// ===================================
// HELPER UTILITIES
// ===================================

function generateId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${random}`;
}

function paginate<T>(items: T[], page: number = 1, limit: number = 20): {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
} {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = items.slice(startIndex, endIndex);

    return {
        data: paginatedData,
        total: items.length,
        page,
        limit,
        totalPages: Math.ceil(items.length / limit),
    };
}

// ===================================
// USER OPERATIONS
// ===================================

const mockUserDb = {
    findAll: () => users,

    findById: (id: string): User | undefined => {
        return users.find((u) => u.id === id);
    },

    findByEmail: (email: string): User | undefined => {
        return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    },

    findByRole: (role: UserRole): User[] => {
        return users.filter((u) => u.role === role);
    },

    create: (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, password: string): User => {
        const newUser: User = {
            id: generateId('user'),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        users.push(newUser);
        passwords[newUser.id] = password;
        return newUser;
    },

    update: (id: string, data: Partial<User>): User | null => {
        const index = users.findIndex((u) => u.id === id);
        if (index === -1) return null;

        const updated = { ...users[index], ...data, updatedAt: new Date() } as User;
        users[index] = updated;
        return updated;
    },

    delete: (id: string): boolean => {
        const index = users.findIndex((u) => u.id === id);
        if (index === -1) return false;

        users.splice(index, 1);
        delete passwords[id];
        return true;
    },

    verifyPassword: (userId: string, password: string): boolean => {
        return passwords[userId] === password;
    },

    updatePassword: (userId: string, newPassword: string): boolean => {
        if (!passwords[userId]) return false;
        passwords[userId] = newPassword;
        return true;
    },
};

// ===================================
// BUYER OPERATIONS
// ===================================

const mockBuyerDb = {
    findAll: () => buyers,

    findById: (id: string): Buyer | undefined => {
        return buyers.find((b) => b.id === id);
    },

    findByUserId: (userId: string): Buyer | undefined => {
        return buyers.find((b) => b.userId === userId);
    },

    create: (data: Omit<Buyer, 'id' | 'createdAt' | 'updatedAt'>): Buyer => {
        const newBuyer: Buyer = {
            id: generateId('buyer'),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        buyers.push(newBuyer);
        return newBuyer;
    },

    update: (id: string, data: Partial<Buyer>): Buyer | null => {
        const index = buyers.findIndex((b) => b.id === id);
        if (index === -1) return null;

        const updated = { ...buyers[index], ...data, updatedAt: new Date() } as Buyer;
        buyers[index] = updated;
        return updated;
    },

    delete: (id: string): boolean => {
        const index = buyers.findIndex((b) => b.id === id);
        if (index === -1) return false;

        buyers.splice(index, 1);
        return true;
    },
};

// ===================================
// VENDOR OPERATIONS
// ===================================

const mockVendorDb = {
    findAll: (filters?: { status?: VendorStatus; campus?: string; category?: string }) => {
        let filtered = vendors;

        if (filters?.status) {
            filtered = filtered.filter((v) => v.status === filters.status);
        }
        if (filters?.campus) {
            filtered = filtered.filter((v) => v.campus === filters.campus);
        }
        if (filters?.category) {
            filtered = filtered.filter((v) => v.category === filters.category);
        }

        return filtered;
    },

    findById: (id: string): Vendor | undefined => {
        return vendors.find((v) => v.id === id);
    },

    findByUserId: (userId: string): Vendor | undefined => {
        return vendors.find((v) => v.userId === userId);
    },

    create: (data: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Vendor => {
        const newVendor: Vendor = {
            id: generateId('vendor'),
            ...data,
            analytics: data.analytics || {
                totalSales: 0,
                totalOrders: 0,
                totalProducts: 0,
                averageRating: 0,
                totalReviews: 0,
                conversionRate: 0,
                lastUpdated: new Date(),
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        vendors.push(newVendor);
        return newVendor;
    },

    update: (id: string, data: Partial<Vendor>): Vendor | null => {
        const index = vendors.findIndex((v) => v.id === id);
        if (index === -1) return null;

        const updated = { ...vendors[index], ...data, updatedAt: new Date() } as Vendor;
        vendors[index] = updated;
        return updated;
    },

    delete: (id: string): boolean => {
        const index = vendors.findIndex((v) => v.id === id);
        if (index === -1) return false;

        vendors.splice(index, 1);
        return true;
    },

    updateAnalytics: (vendorId: string): void => {
        const vendor = vendors.find((v) => v.id === vendorId);
        if (!vendor) return;

        const vendorOrders = orders.filter(
            (o) => o.vendorId === vendorId && o.status === OrderStatus.DELIVERED
        );
        const vendorProducts = products.filter((p) => p.vendorId === vendorId);
        const vendorReviews = reviews.filter((r) =>
            vendorProducts.some((p) => p.id === r.productId)
        );

        const totalSales = vendorOrders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = vendorOrders.length;
        const totalProducts = vendorProducts.length;
        const averageRating =
            vendorReviews.length > 0
                ? vendorReviews.reduce((sum, r) => sum + r.rating, 0) / vendorReviews.length
                : 0;

        vendor.analytics = {
            totalSales,
            totalOrders,
            totalProducts,
            averageRating,
            totalReviews: vendorReviews.length,
            conversionRate: vendor.analytics?.conversionRate || 0,
            lastUpdated: new Date(),
        };
    },
};

// ===================================
// PRODUCT OPERATIONS
// ===================================

const mockProductDb = {
    findAll: (filters?: {
        vendorId?: string;
        category?: string;
        listingType?: string;
        isActive?: boolean;
        isFeatured?: boolean;
        search?: string;
        minPrice?: number;
        maxPrice?: number;
        page?: number;
        limit?: number;
    }) => {
        let filtered = products;

        if (filters?.vendorId) {
            filtered = filtered.filter((p) => p.vendorId === filters.vendorId);
        }
        if (filters?.category) {
            filtered = filtered.filter((p) => p.category === filters.category);
        }
        if (filters?.listingType) {
            filtered = filtered.filter((p) => p.listingType === filters.listingType);
        }
        if (filters?.isActive !== undefined) {
            filtered = filtered.filter((p) => p.isActive === filters.isActive);
        }
        if (filters?.isFeatured !== undefined) {
            filtered = filtered.filter((p) => p.isFeatured === filters.isFeatured);
        }
        if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.name.toLowerCase().includes(searchLower) ||
                    p.description.toLowerCase().includes(searchLower) ||
                    p.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
            );
        }
        if (filters?.minPrice !== undefined) {
            filtered = filtered.filter((p) => p.price >= filters.minPrice!);
        }
        if (filters?.maxPrice !== undefined) {
            filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
        }

        // Sort by featured first, then by createdAt desc
        filtered.sort((a, b) => {
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        if (filters?.page && filters?.limit) {
            return paginate(filtered, filters.page, filters.limit);
        }

        return filtered;
    },

    findById: (id: string): Product | undefined => {
        return products.find((p) => p.id === id);
    },

    findByVendor: (vendorId: string): Product[] => {
        return products.filter((p) => p.vendorId === vendorId);
    },

    create: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
        const newProduct: Product = {
            ...data,
            id: generateId('prod'),
            views: data.views ?? 0,
            sales: data.sales ?? 0,
            averageRating: data.averageRating ?? 0,
            totalReviews: data.totalReviews ?? 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        products.push(newProduct);
        return newProduct;
    },

    update: (id: string, data: Partial<Product>): Product | null => {
        const index = products.findIndex((p) => p.id === id);
        if (index === -1) return null;

        const updated = { ...products[index], ...data, updatedAt: new Date() } as Product;
        products[index] = updated;
        return updated;
    },

    delete: (id: string): boolean => {
        const index = products.findIndex((p) => p.id === id);
        if (index === -1) return false;

        products.splice(index, 1);
        return true;
    },
    count: (filters?: {
        vendorId?: string;
        category?: string;
        listingType?: string;
        isActive?: boolean;
        isFeatured?: boolean;
        search?: string;
        minPrice?: number;
        maxPrice?: number;
    }): number => {
        const result = mockProductDb.findAll({ ...(filters || {}), page: undefined, limit: undefined }) as any;
        if (Array.isArray(result)) return result.length;
        if (result && result.data) return result.total ?? result.data.length;
        return 0;
    },

    incrementViews: (id: string): void => {
        const product = products.find((p) => p.id === id);
        if (product) {
            product.views = (product.views || 0) + 1;
        }
    },

    updateRating: (productId: string): void => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        const productReviews = reviews.filter((r) => r.productId === productId);
        if (productReviews.length === 0) {
            product.averageRating = 0;
            product.totalReviews = 0;
            return;
        }

        const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
        product.averageRating = totalRating / productReviews.length;
        product.totalReviews = productReviews.length;
    },
};

// ===================================
// CART OPERATIONS
// ===================================

const mockCartDb = {
    findAll: () => carts,

    findById: (id: string): Cart | undefined => {
        return carts.find((c) => c.id === id);
    },

    findByBuyerId: (buyerId: string): Cart | undefined => {
        return carts.find((c) => c.buyerId === buyerId);
    },

    create: (buyerId: string): Cart => {
        const existingCart = carts.find((c) => c.buyerId === buyerId);
        if (existingCart) return existingCart;

        const newCart: Cart = {
            id: generateId('cart'),
            buyerId,
            items: [],
            subtotal: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        carts.push(newCart);
        return newCart;
    },

    addItem: (
        buyerId: string,
        productId: string,
        quantity: number,
        selectedVariants?: Record<string, string>
    ): Cart | null => {
        let cart = carts.find((c) => c.buyerId === buyerId);
        if (!cart) {
            cart = mockCartDb.create(buyerId);
        }

        const product = products.find((p) => p.id === productId);
        if (!product) return null;

        // Check if item already exists (same product + variants)
        const existingItemIndex = cart.items.findIndex(
            (item) =>
                item.productId === productId &&
                JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
        );

        if (existingItemIndex !== -1) {
            // Update quantity
            const existingItem = cart.items[existingItemIndex];
            if (existingItem) {
                existingItem.quantity += quantity;
                existingItem.subtotal = existingItem.quantity * existingItem.price;
            }
        } else {
            // Add new item
            const newItem: CartItem = {
                id: generateId('cart-item'),
                cartId: cart.id,
                productId,
                quantity,
                price: product.price,
                subtotal: product.price * quantity,
                selectedVariants,
                addedAt: new Date(),
            };
            cart.items.push(newItem);
        }

        // Recalculate subtotal
        cart.subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
        cart.updatedAt = new Date();

        return cart;
    },

    updateItemQuantity: (cartId: string, itemId: string, quantity: number): Cart | null => {
        const cart = carts.find((c) => c.id === cartId);
        if (!cart) return null;

        const item = cart.items.find((i) => i.id === itemId);
        if (!item) return null;

        if (quantity <= 0) {
            // Remove item
            cart.items = cart.items.filter((i) => i.id !== itemId);
        } else {
            item.quantity = quantity;
            item.subtotal = item.price * quantity;
        }

        // Recalculate subtotal
        cart.subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
        cart.updatedAt = new Date();

        return cart;
    },

    removeItem: (cartId: string, itemId: string): Cart | null => {
        const cart = carts.find((c) => c.id === cartId);
        if (!cart) return null;

        cart.items = cart.items.filter((i) => i.id !== itemId);

        // Recalculate subtotal
        cart.subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
        cart.updatedAt = new Date();

        return cart;
    },

    clear: (buyerId: string): boolean => {
        const cart = carts.find((c) => c.buyerId === buyerId);
        if (!cart) return false;

        cart.items = [];
        cart.subtotal = 0;
        cart.updatedAt = new Date();

        return true;
    },

    delete: (id: string): boolean => {
        const index = carts.findIndex((c) => c.id === id);
        if (index === -1) return false;

        carts.splice(index, 1);
        return true;
    },
};

// ===================================
// ORDER OPERATIONS
// ===================================

const mockOrderDb = {
    findAll: (filters?: {
        buyerId?: string;
        vendorId?: string;
        status?: OrderStatus;
        paymentStatus?: PaymentStatus;
        page?: number;
        limit?: number;
    }) => {
        let filtered = orders;

        if (filters?.buyerId) {
            filtered = filtered.filter((o) => o.buyerId === filters.buyerId);
        }
        if (filters?.vendorId) {
            filtered = filtered.filter((o) => o.vendorId === filters.vendorId);
        }
        if (filters?.status) {
            filtered = filtered.filter((o) => o.status === filters.status);
        }
        if (filters?.paymentStatus) {
            filtered = filtered.filter((o) => o.paymentStatus === filters.paymentStatus);
        }

        // Sort by createdAt desc
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (filters?.page && filters?.limit) {
            return paginate(filtered, filters.page, filters.limit);
        }

        return filtered;
    },

    findById: (id: string): Order | undefined => {
        return orders.find((o) => o.id === id);
    },

    findByOrderNumber: (orderNumber: string): Order | undefined => {
        return orders.find((o) => o.orderNumber === orderNumber);
    },

    create: (data: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order => {
        const orderNumber = `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`;

        const newOrder: Order = {
            ...data,
            id: generateId('order'),
            orderNumber,
            status: data.status ?? OrderStatus.PENDING,
            paymentStatus: data.paymentStatus ?? PaymentStatus.PENDING,
            statusHistory: data.statusHistory ?? [
                {
                    status: OrderStatus.PENDING,
                    timestamp: new Date(),
                    updatedBy: data.buyerId,
                },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        orders.push(newOrder);
        return newOrder;
    },

    updateStatus: (id: string, status: OrderStatus, updatedBy: string): Order | null => {
        const order = orders.find((o) => o.id === id);
        if (!order) return null;

        order.status = status;
        order.statusHistory.push({
            status,
            timestamp: new Date(),
            updatedBy,
        });
        order.updatedAt = new Date();

        if (status === OrderStatus.DELIVERED) {
            order.completedAt = new Date();
        }

        return order;
    },

    updatePaymentStatus: (id: string, paymentStatus: PaymentStatus): Order | null => {
        const order = orders.find((o) => o.id === id);
        if (!order) return null;

        order.paymentStatus = paymentStatus;
        order.updatedAt = new Date();

        return order;
    },

    update: (id: string, data: Partial<Order>): Order | null => {
        const index = orders.findIndex((o) => o.id === id);
        if (index === -1) return null;

        const updated = { ...orders[index], ...data, updatedAt: new Date() } as Order;
        orders[index] = updated;
        return updated;
    },

    delete: (id: string): boolean => {
        const index = orders.findIndex((o) => o.id === id);
        if (index === -1) return false;

        orders.splice(index, 1);
        return true;
    },
};

// ===================================
// WALLET OPERATIONS
// ===================================

const mockWalletDb = {
    findAll: () => wallets,

    findById: (id: string): Wallet | undefined => {
        return wallets.find((w) => w.id === id);
    },

    findByUserId: (userId: string): Wallet | undefined => {
        return wallets.find((w) => w.userId === userId);
    },

    create: (userId: string): Wallet => {
        const existingWallet = wallets.find((w) => w.userId === userId);
        if (existingWallet) return existingWallet;

        const newWallet: Wallet = {
            id: generateId('wallet'),
            userId,
            balance: 0,
            currency: 'NGN',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        wallets.push(newWallet);
        return newWallet;
    },

    updateBalance: (walletId: string, amount: number): Wallet | null => {
        const wallet = wallets.find((w) => w.id === walletId);
        if (!wallet) return null;

        wallet.balance += amount;
        wallet.updatedAt = new Date();

        return wallet;
    },

    debit: (walletId: string, amount: number): Wallet | null => {
        const wallet = wallets.find((w) => w.id === walletId);
        if (!wallet || wallet.balance < amount) return null;

        wallet.balance -= amount;
        wallet.updatedAt = new Date();

        return wallet;
    },

    credit: (walletId: string, amount: number): Wallet | null => {
        const wallet = wallets.find((w) => w.id === walletId);
        if (!wallet) return null;

        wallet.balance += amount;
        wallet.updatedAt = new Date();

        return wallet;
    },

    delete: (id: string): boolean => {
        const index = wallets.findIndex((w) => w.id === id);
        if (index === -1) return false;

        wallets.splice(index, 1);
        return true;
    },
};

// ===================================
// TRANSACTION OPERATIONS
// ===================================

const mockTransactionDb = {
    findAll: (filters?: {
        walletId?: string;
        type?: string;
        status?: TransactionStatus;
        page?: number;
        limit?: number;
    }) => {
        let filtered = transactions;

        if (filters?.walletId) {
            filtered = filtered.filter((t) => t.walletId === filters.walletId);
        }
        if (filters?.type) {
            filtered = filtered.filter((t) => t.type === filters.type);
        }
        if (filters?.status) {
            filtered = filtered.filter((t) => t.status === filters.status);
        }

        // Sort by createdAt desc
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (filters?.page && filters?.limit) {
            return paginate(filtered, filters.page, filters.limit);
        }

        return filtered;
    },

    findById: (id: string): Transaction | undefined => {
        return transactions.find((t) => t.id === id);
    },

    findByReference: (reference: string): Transaction | undefined => {
        return transactions.find((t) => t.reference === reference);
    },

    create: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction => {
        const newTransaction: Transaction = {
            id: generateId('txn'),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        transactions.push(newTransaction);
        return newTransaction;
    },

    updateStatus: (id: string, status: TransactionStatus): Transaction | null => {
        const transaction = transactions.find((t) => t.id === id);
        if (!transaction) return null;

        transaction.status = status;
        transaction.updatedAt = new Date();

        return transaction;
    },
};

// ===================================
// REVIEW OPERATIONS
// ===================================

const mockReviewDb = {
    findAll: (filters?: { productId?: string; buyerId?: string; rating?: number }) => {
        let filtered = reviews;

        if (filters?.productId) {
            filtered = filtered.filter((r) => r.productId === filters.productId);
        }
        if (filters?.buyerId) {
            filtered = filtered.filter((r) => r.buyerId === filters.buyerId);
        }
        if (filters?.rating) {
            filtered = filtered.filter((r) => r.rating === filters.rating);
        }

        return filtered.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    },

    findById: (id: string): Review | undefined => {
        return reviews.find((r) => r.id === id);
    },

    create: (data: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Review => {
        const newReview: Review = {
            ...data,
            id: generateId('review'),
            helpfulCount: data.helpfulCount ?? 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        reviews.push(newReview);

        // Update product rating
        productDb.updateRating(data.productId);

        return newReview;
    },

    update: (id: string, data: Partial<Review>): Review | null => {
        const index = reviews.findIndex((r) => r.id === id);
        if (index === -1) return null;

        const review = reviews[index];
        if (!review) return null;

        const productId = review.productId;
        const updated = { ...review, ...data, updatedAt: new Date() } as Review;
        reviews[index] = updated;

        // Update product rating if rating changed
        if (data.rating !== undefined) {
            productDb.updateRating(productId);
        }

        return updated;
    },

    delete: (id: string): boolean => {
        const review = reviews.find((r) => r.id === id);
        if (!review) return false;

        const index = reviews.findIndex((r) => r.id === id);
        reviews.splice(index, 1);

        // Update product rating
        productDb.updateRating(review.productId);

        return true;
    },

    incrementHelpful: (id: string): void => {
        const review = reviews.find((r) => r.id === id);
        if (review) {
            review.helpfulCount = (review.helpfulCount || 0) + 1;
        }
    },
};

// ===================================
// BANNER OPERATIONS
// ===================================

const mockBannerDb = {
    findAll: (isActive?: boolean) => {
        let filtered = banners;

        if (isActive !== undefined) {
            filtered = filtered.filter((b) => b.isActive === isActive);
        }

        return filtered.sort((a, b) => a.displayOrder - b.displayOrder);
    },

    findById: (id: string): Banner | undefined => {
        return banners.find((b) => b.id === id);
    },

    create: (data: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Banner => {
        const newBanner: Banner = {
            ...data,
            id: generateId('banner'),
            clickCount: data.clickCount ?? 0,
            impressionCount: data.impressionCount ?? 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        banners.push(newBanner);
        return newBanner;
    },

    update: (id: string, data: Partial<Banner>): Banner | null => {
        const index = banners.findIndex((b) => b.id === id);
        if (index === -1) return null;

        const updated = { ...banners[index], ...data, updatedAt: new Date() } as Banner;
        banners[index] = updated;
        return updated;
    },

    delete: (id: string): boolean => {
        const index = banners.findIndex((b) => b.id === id);
        if (index === -1) return false;

        banners.splice(index, 1);
        return true;
    },

    incrementClicks: (id: string): void => {
        const banner = banners.find((b) => b.id === id);
        if (banner) {
            banner.clickCount = (banner.clickCount || 0) + 1;
        }
    },

    incrementImpressions: (id: string): void => {
        const banner = banners.find((b) => b.id === id);
        if (banner) {
            banner.impressionCount = (banner.impressionCount || 0) + 1;
        }
    },
};

// ===================================
// ADDRESS OPERATIONS
// ===================================

const mockAddressDb = {
    findAll: (userId?: string) => {
        if (userId) {
            return addresses.filter((a) => a.userId === userId);
        }
        return addresses;
    },

    findById: (id: string): Address | undefined => {
        return addresses.find((a) => a.id === id);
    },

    findDefault: (userId: string): Address | undefined => {
        return addresses.find((a) => a.userId === userId && a.isDefault);
    },

    create: (data: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Address => {
        // If this is the first address or marked as default, unset other defaults
        if (data.isDefault) {
            addresses.forEach((addr) => {
                if (addr.userId === data.userId) {
                    addr.isDefault = false;
                }
            });
        }

        const newAddress: Address = {
            id: generateId('addr'),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        addresses.push(newAddress);
        return newAddress;
    },

    update: (id: string, data: Partial<Address>): Address | null => {
        const index = addresses.findIndex((a) => a.id === id);
        if (index === -1) return null;

        const address = addresses[index];
        if (!address) return null;

        // If setting as default, unset other defaults for this user
        const userId = address.userId;
        if (data.isDefault) {
            addresses.forEach((addr) => {
                if (addr.userId === userId && addr.id !== id) {
                    addr.isDefault = false;
                }
            });
        }

        const updated = { ...address, ...data, updatedAt: new Date() } as Address;
        addresses[index] = updated;
        return updated;
    },

    delete: (id: string): boolean => {
        const index = addresses.findIndex((a) => a.id === id);
        if (index === -1) return false;

        addresses.splice(index, 1);
        return true;
    },
};

// ===================================
// DATABASE STATS & UTILITIES
// ===================================

export const dbStats = {
    getStats: () => ({
        users: users.length,
        buyers: buyers.length,
        vendors: vendors.length,
        products: products.length,
        orders: orders.length,
        carts: carts.length,
        wallets: wallets.length,
        transactions: transactions.length,
        reviews: reviews.length,
        banners: banners.length,
        addresses: addresses.length,
    }),

    reset: () => {
        users = [...mockUsers];
        buyers = [...mockBuyers];
        vendors = [...mockVendors];
        products = [...mockProducts];
        orders = [...mockOrders];
        carts = [...mockCarts];
        wallets = [...mockWallets];
        transactions = [...mockTransactions];
        reviews = [...mockReviews];
        banners = [...mockBanners];
        addresses = [...mockAddresses];
    },
};

// ===================================
// UNIFIED DATABASE EXPORT
// ===================================

function missingAdapter(name: string) {
    const handler: ProxyHandler<any> = {
        get() {
            return () => {
                throw new Error(
                    `Prisma adapter for '${name}' is not implemented.\n` +
                    `Add the adapter in lib/data/prismaAdapter.ts or set USE_PRISMA=false to use mocks.`
                );
            };
        },
    };

    return new Proxy({}, handler) as any;
}

if (usePrisma) {
    // Warn when running in Prisma mode and any adapters are missing
    const available = Object.keys(prismaAdapter || {});
    const expected = ['userDb', 'productDb', 'bannerDb', 'orderDb'];
    const missing = expected.filter((k) => !available.includes(k));
    if (missing.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(`Prisma mode enabled but adapters missing: ${missing.join(', ')}`);
    }
}

export const userDb = usePrisma ? prismaAdapter.userDb : mockUserDb as any;
export const buyerDb = usePrisma ? (prismaAdapter.buyerDb ?? missingAdapter('buyerDb')) : mockBuyerDb as any;
export const vendorDb = usePrisma ? (prismaAdapter.vendorDb ?? missingAdapter('vendorDb')) : mockVendorDb as any;
export const productDb = usePrisma ? prismaAdapter.productDb : mockProductDb as any;
export const cartDb = usePrisma ? (prismaAdapter.cartDb ?? missingAdapter('cartDb')) : mockCartDb as any;
export const orderDb = usePrisma ? prismaAdapter.orderDb : mockOrderDb as any;
export const walletDb = usePrisma ? (prismaAdapter.walletDb ?? missingAdapter('walletDb')) : mockWalletDb as any;
export const transactionDb = usePrisma ? (prismaAdapter.transactionDb ?? missingAdapter('transactionDb')) : mockTransactionDb as any;
export const reviewDb = usePrisma ? (prismaAdapter.reviewDb ?? missingAdapter('reviewDb')) : mockReviewDb as any;
export const bannerDb = usePrisma ? prismaAdapter.bannerDb : mockBannerDb as any;
export const addressDb = usePrisma ? (prismaAdapter.addressDb ?? missingAdapter('addressDb')) : mockAddressDb as any;

export const db = {
    users: userDb,
    buyers: buyerDb,
    vendors: vendorDb,
    products: productDb,
    carts: cartDb,
    orders: orderDb,
    wallets: walletDb,
    transactions: transactionDb,
    reviews: reviewDb,
    banners: bannerDb,
    addresses: addressDb,
    stats: dbStats,
};
