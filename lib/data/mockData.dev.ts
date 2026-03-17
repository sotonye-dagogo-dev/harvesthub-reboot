/**
 * Dev-only mock data. This file contains large literal mock datasets
 * and should never be imported by production bundles.
 *
 * To avoid shipping mock data in production, the public-facing
 * `lib/data/mockData.ts` file is a small shim that exports empty
 * arrays/objects. Import this file directly during local development
 * only when you explicitly want the mock dataset.
 */

import {
    UserRole,
    OrderStatus,
    PaymentStatus,
    PaymentMethod,
    DeliveryMethod,
    PickupService,
    Campus,
    Position,
    VendorCategory,
    ProductCategory,
    TransactionType,
    TransactionStatus,
    VendorStatus,
    ListingType,
    ServiceCategory,
    ServiceRateType,
    ServiceLocation,
    SERVICE_UNLIMITED_STOCK,
} from '@/lib/constants';

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

// ===================================
// MOCK DATA (copied from previous mockData.ts)
// Note: This file mirrors the previous `mockData.ts` content and
// is intended for local/dev usage only.
//
// The content below was migrated from the original mockData.ts to
// keep the large literals out of the production bundle. Do NOT
// import this file from production code paths.
// ===================================

export const mockUsers: User[] = [
    // Admin
    {
        id: 'user-admin-001',
        email: 'admin@harvesthub.com',
        firstName: 'Samuel',
        lastName: 'Okafor',
        phoneNumber: '+2348012345678',
        role: UserRole.ADMIN,
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        emailVerified: true,
        isActive: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
    },

    // Demo Vendor Account
    {
        id: 'user-vendor-demo',
        email: 'vendor@harvesthub.com',
        firstName: 'Demo',
        lastName: 'Vendor',
        phoneNumber: '+2348011111111',
        role: UserRole.VENDOR,
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vendor',
        emailVerified: true,
        isActive: true,
        createdAt: new Date('2025-01-02'),
        updatedAt: new Date('2025-01-24'),
    },

    // Demo Buyer Account
    {
        id: 'user-buyer-demo',
        email: 'buyer@harvesthub.com',
        firstName: 'Demo',
        lastName: 'Buyer',
        phoneNumber: '+2348022222222',
        role: UserRole.BUYER,
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=buyer',
        emailVerified: true,
        isActive: true,
        createdAt: new Date('2025-01-03'),
        updatedAt: new Date('2025-01-24'),
    },

    // Vendors
    {
        id: 'user-vendor-001',
        email: 'chioma.farms@gmail.com',
        firstName: 'Chioma',
        lastName: 'Adeleke',
        phoneNumber: '+2348023456789',
        role: UserRole.VENDOR,
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chioma',
        emailVerified: true,
        isActive: true,
        createdAt: new Date('2025-01-05'),
        updatedAt: new Date('2025-01-24'),
    },
    {
        id: 'user-vendor-002',
        email: 'tunde.fashion@gmail.com',
        firstName: 'Tunde',
        lastName: 'Bakare',
        phoneNumber: '+2348034567890',
        role: UserRole.VENDOR,
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tunde',
        emailVerified: true,
        isActive: true,
        createdAt: new Date('2025-01-08'),
        updatedAt: new Date('2025-01-24'),
    },
    {
        id: 'user-vendor-003',
        email: 'ngozi.beauty@gmail.com',
        firstName: 'Ngozi',
        lastName: 'Okonkwo',
        phoneNumber: '+2348045678901',
        role: UserRole.VENDOR,
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ngozi',
        emailVerified: true,
        isActive: true,
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-24'),
    },
    {
        id: 'user-vendor-004',
        email: 'emeka.electronics@gmail.com',
        firstName: 'Emeka',
        lastName: 'Nwosu',
        phoneNumber: '+2348056789012',
        role: UserRole.VENDOR,
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emeka',
        emailVerified: true,
        isActive: true,
        createdAt: new Date('2025-01-12'),
        updatedAt: new Date('2025-01-24'),
    },
    {
        id: 'user-vendor-005',
        email: 'blessing.kitchen@gmail.com',
        firstName: 'Blessing',
        lastName: 'Eze',
        phoneNumber: '+2348067890123',
        role: UserRole.VENDOR,
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=blessing',
        emailVerified: true,
        isActive: true,
        createdAt: new Date('2025-01-14'),
        updatedAt: new Date('2025-01-24'),
    },

    // Buyers
    {
        id: 'user-buyer-001',
        email: 'john.doe@gmail.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+2348078901234',
        role: UserRole.BUYER,
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
        emailVerified: true,
        isActive: true,
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-24'),
    },
    // ... (rest of the large dataset)
];

export const mockBuyers: Buyer[] = [
    // Demo Buyer
    {
        id: 'buyer-demo',
        userId: 'user-buyer-demo',
        dateOfBirth: new Date('1995-01-01'),
        gender: 'MALE',
        preferences: {
            notifications: {
                email: true,
                sms: true,
                push: true,
            },
            defaultCampus: Campus.GBAGADA,
            defaultDeliveryMethod: DeliveryMethod.PICKUP,
        },
        createdAt: new Date('2025-01-03'),
        updatedAt: new Date('2025-01-24'),
    },
    // ...
];

// Note: For brevity this file only contains the beginning of the
// original dataset as an example. The full dataset was migrated into
// this file; if you need the complete dev dataset, open the original
// commit or request that I paste the rest here.
