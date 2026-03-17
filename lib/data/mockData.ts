/**
 * Mock data shim
 *
 * This file intentionally exports empty datasets so that production
 * code importing mock data does not receive or bundle large mock
 * literals. For local development you can import
 * lib/data/mockData.dev.ts explicitly when you intentionally need
 * the mock dataset.
 */

import type {
    User,
    Buyer,
    Vendor,
    Product,
    Order,
    Cart,
    Wallet,
    Transaction,
    Review,
    Banner,
    Address,
} from '@/lib/types';

export const mockUsers: User[] = [];
export const mockBuyers: Buyer[] = [];
export const mockVendors: Vendor[] = [];
export const mockProducts: Product[] = [];
export const mockOrders: Order[] = [];
export const mockCarts: Cart[] = [];
export const mockWallets: Wallet[] = [];
export const mockTransactions: Transaction[] = [];
export const mockReviews: Review[] = [];
export const mockBanners: Banner[] = [];
export const mockAddresses: Address[] = [];
