/**
 * HarvestHub Platform Constants
 * All enums, configuration values, and static data used across the application
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum UserRole {
    ADMIN = 'ADMIN',
    VENDOR = 'VENDOR',
    BUYER = 'BUYER',
}

export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PROCESSING = 'PROCESSING',
    READY = 'READY',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
    WALLET = 'WALLET',
    CARD = 'CARD',
    BANK_TRANSFER = 'BANK_TRANSFER',
    USSD = 'USSD',
}

export enum DeliveryMethod {
    PICKUP = 'PICKUP',
    DELIVERY = 'DELIVERY',
}

export enum PickupService {
    SUNDAY_FIRST = 'SUNDAY_FIRST',
    SUNDAY_SECOND = 'SUNDAY_SECOND',
    MIDWEEK = 'MIDWEEK',
    SPECIAL_EVENT = 'SPECIAL_EVENT',
}

export enum Campus {
    OREGUN_HQ = 'OREGUN_HQ',
    LEKKI = 'LEKKI',
    VICTORIA_ISLAND = 'VICTORIA_ISLAND',
    IKEJA = 'IKEJA',
    FESTAC = 'FESTAC',
    AJAH = 'AJAH',
    OUTSIDE_LAGOS = 'OUTSIDE_LAGOS',
}

export enum VendorCategory {
    FARM_PRODUCE = 'FARM_PRODUCE',
    FASHION = 'FASHION',
    FOOD_BEVERAGES = 'FOOD_BEVERAGES',
    BEAUTY = 'BEAUTY',
    ELECTRONICS = 'ELECTRONICS',
    HOME_KITCHEN = 'HOME_KITCHEN',
    BOOKS = 'BOOKS',
    SERVICES = 'SERVICES',
    CRAFTS = 'CRAFTS',
    OTHERS = 'OTHERS',
}

export enum ProductCategory {
    FARM_PRODUCE = 'FARM_PRODUCE',
    FASHION = 'FASHION',
    FOOD_BEVERAGES = 'FOOD_BEVERAGES',
    BEAUTY = 'BEAUTY',
    ELECTRONICS = 'ELECTRONICS',
    HOME_KITCHEN = 'HOME_KITCHEN',
    BOOKS = 'BOOKS',
    SERVICES = 'SERVICES',
    CRAFTS = 'CRAFTS',
    OTHERS = 'OTHERS',
}

export enum TransactionType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
    PAYMENT = 'PAYMENT',
    REFUND = 'REFUND',
    COMMISSION = 'COMMISSION',
    PAYOUT = 'PAYOUT',
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    REVERSED = 'REVERSED',
}

export enum VendorStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    SUSPENDED = 'SUSPENDED',
}

// ============================================================================
// CAMPUS LOCATIONS
// ============================================================================

export const CAMPUS_LOCATIONS = [
    {
        value: Campus.OREGUN_HQ,
        label: 'Oregun (Headquarters)',
        description: 'Main campus in Oregun, Lagos',
        address: 'Oregun, Lagos State',
    },
    {
        value: Campus.LEKKI,
        label: 'Lekki',
        description: 'Lekki Peninsula campus',
        address: 'Lekki, Lagos State',
    },
    {
        value: Campus.VICTORIA_ISLAND,
        label: 'Victoria Island',
        description: 'Victoria Island business district',
        address: 'Victoria Island, Lagos State',
    },
    {
        value: Campus.IKEJA,
        label: 'Ikeja',
        description: 'Ikeja and environs',
        address: 'Ikeja, Lagos State',
    },
    {
        value: Campus.FESTAC,
        label: 'Festac',
        description: 'Festac Town',
        address: 'Festac Town, Lagos State',
    },
    {
        value: Campus.AJAH,
        label: 'Ajah',
        description: 'Ajah and Badore area',
        address: 'Ajah, Lagos State',
    },
    {
        value: Campus.OUTSIDE_LAGOS,
        label: 'Outside Lagos',
        description: 'Other Nigerian states',
        address: 'Outside Lagos State',
    },
] as const;

// ============================================================================
// PICKUP SERVICES
// ============================================================================

export const PICKUP_SERVICES = [
    {
        value: PickupService.SUNDAY_FIRST,
        label: 'Sunday Service (First)',
        timeRange: '7:00 AM - 9:30 AM',
        description: 'First Sunday service',
    },
    {
        value: PickupService.SUNDAY_SECOND,
        label: 'Sunday Service (Second)',
        timeRange: '9:30 AM - 12:00 PM',
        description: 'Second Sunday service',
    },
    {
        value: PickupService.MIDWEEK,
        label: 'Midweek Service',
        timeRange: '6:00 PM - 8:00 PM',
        description: 'Wednesday midweek service',
    },
    {
        value: PickupService.SPECIAL_EVENT,
        label: 'Special Event',
        timeRange: 'As scheduled',
        description: 'Special church events',
    },
] as const;

// ============================================================================
// VENDOR & PRODUCT CATEGORIES
// ============================================================================

export const VENDOR_CATEGORIES = [
    {
        value: VendorCategory.FARM_PRODUCE,
        label: 'Farm Produce',
        description: 'Fresh farm produce, vegetables, fruits',
    },
    {
        value: VendorCategory.FASHION,
        label: 'Fashion & Apparel',
        description: 'Clothing, shoes, accessories',
    },
    {
        value: VendorCategory.FOOD_BEVERAGES,
        label: 'Food & Beverages',
        description: 'Packaged food, drinks, snacks',
    },
    {
        value: VendorCategory.BEAUTY,
        label: 'Beauty & Cosmetics',
        description: 'Skincare, makeup, hair care',
    },
    {
        value: VendorCategory.ELECTRONICS,
        label: 'Electronics & Gadgets',
        description: 'Phones, laptops, accessories',
    },
    {
        value: VendorCategory.HOME_KITCHEN,
        label: 'Home & Kitchen',
        description: 'Furniture, utensils, decor',
    },
    {
        value: VendorCategory.BOOKS,
        label: 'Books & Stationery',
        description: 'Books, notebooks, office supplies',
    },
    {
        value: VendorCategory.SERVICES,
        label: 'Services',
        description: 'Professional services',
    },
    {
        value: VendorCategory.CRAFTS,
        label: 'Crafts & Handmade',
        description: 'Handmade items, art, crafts',
    },
    {
        value: VendorCategory.OTHERS,
        label: 'Others',
        description: 'Other product categories',
    },
] as const;

export const PRODUCT_CATEGORIES = VENDOR_CATEGORIES;

// ============================================================================
// DELIVERY ZONES & PRICING
// ============================================================================

export const DELIVERY_ZONES = [
    {
        zone: 1,
        name: 'Zone 1',
        description: 'Within 5km of campus',
        minFee: 500,
        maxFee: 1000,
        estimatedTime: '30-60 minutes',
    },
    {
        zone: 2,
        name: 'Zone 2',
        description: '5-10km from campus',
        minFee: 1000,
        maxFee: 1500,
        estimatedTime: '1-2 hours',
    },
    {
        zone: 3,
        name: 'Zone 3',
        description: '10-20km from campus',
        minFee: 1500,
        maxFee: 2500,
        estimatedTime: '2-4 hours',
    },
    {
        zone: 4,
        name: 'Zone 4',
        description: 'Outside Lagos',
        minFee: 2500,
        maxFee: null,
        estimatedTime: 'Custom quotes',
    },
] as const;

// ============================================================================
// PAGINATION
// ============================================================================

export const PAGINATION_DEFAULTS = {
    PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    DEFAULT_PAGE: 1,
} as const;

// ============================================================================
// TOKEN EXPIRY
// ============================================================================

export const TOKEN_EXPIRY = {
    ACCESS_TOKEN: '15m', // 15 minutes
    REFRESH_TOKEN: '7d', // 7 days
} as const;

// ============================================================================
// CURRENCY
// ============================================================================

export const CURRENCY_FORMAT = {
    SYMBOL: '₦',
    CODE: 'NGN',
    LOCALE: 'en-NG',
} as const;

// ============================================================================
// PHONE PREFIX
// ============================================================================

export const PHONE_PREFIX = '+234' as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION_RULES = {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    PHONE_LENGTH: 11, // After +234
    MIN_DEPOSIT: 100,
    MAX_WITHDRAWAL: 1000000,
    MIN_PRODUCT_PRICE: 1,
    MAX_PRODUCT_NAME_LENGTH: 200,
    MAX_PRODUCT_DESCRIPTION_LENGTH: 2000,
    MAX_REVIEW_LENGTH: 1000,
    MIN_RATING: 1,
    MAX_RATING: 5,
    MAX_IMAGES_PER_PRODUCT: 5,
    MAX_IMAGES_PER_REVIEW: 3,
} as const;

// ============================================================================
// ORDER STATUS FLOW
// ============================================================================

export const ORDER_STATUS_FLOW = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.READY, OrderStatus.CANCELLED],
    [OrderStatus.READY]: [OrderStatus.COMPLETED],
    [OrderStatus.COMPLETED]: [OrderStatus.REFUNDED],
    [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
    [OrderStatus.REFUNDED]: [],
} as const;

// ============================================================================
// COMMISSION RATES
// ============================================================================

export const COMMISSION_RATES = {
    DEFAULT: 0.05, // 5%
    PREMIUM_VENDOR: 0.03, // 3%
    CHURCH_AFFILIATED: 0.02, // 2%
} as const;

// ============================================================================
// FILE UPLOAD
// ============================================================================

export const FILE_UPLOAD = {
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// ============================================================================
// APP CONFIG
// ============================================================================

export const APP_CONFIG = {
    NAME: 'HarvestHub',
    DESCRIPTION: 'E-Commerce Marketplace for the Harvesters Community',
    URL: 'https://harvesthub.ng',
    SUPPORT_EMAIL: 'support@harvesthub.ng',
    SUPPORT_PHONE: '+234 800 000 0000',
} as const;

// ============================================================================
// BANNER CONFIG
// ============================================================================

/**
 * Central configuration for the banner system.
 *
 * ROTATION          – how many milliseconds between auto-advances
 * TRANSITION_MS     – CSS transition duration used in animation classes
 * DISMISS_STORAGE_KEY – localStorage key tracking dismissed TOP banner IDs
 * HERO_DISPLAY_INTERVAL – interval for hero carousel auto-play (matches designer spec)
 * TOP_DISPLAY_INTERVAL  – interval for rotating the small fixed top strip
 *
 * THEME_STYLES maps each BannerTheme to a set of Tailwind classes so that
 * every new theme variant only needs one entry here, keeping components
 * theme-agnostic and easy to extend.
 */
export const BANNER_CONFIG = {
    /** AUTO-ROTATION */
    HERO_DISPLAY_INTERVAL: 5000,   // 5 s – hero carousel
    TOP_DISPLAY_INTERVAL: 5000,    // 5 s – top ad strip rotation

    /** ANIMATION */
    TRANSITION_MS: 400,

    /** PERSISTENCE */
    DISMISS_STORAGE_KEY: 'hh_dismissed_top_banners',

    /** DEFAULT LABELS */
    KNOW_MORE_LABEL: 'Know More',
    DEFAULT_CTA_LABEL: 'Learn More',

    /** HERO LAYOUT */
    // Fraction of the hero width given to the display panel on large screens
    // e.g. "70" → 70% display, 30% action
    DISPLAY_PANEL_PERCENT: 65,
    ACTION_PANEL_PERCENT: 35,

    /** Per-theme design tokens (Tailwind class strings) */
    THEME_STYLES: {
        BUSINESS: {
            actionBg: 'bg-purple-700',
            actionBgDark: 'dark:bg-purple-900',
            actionText: 'text-white',
            accentBg: 'bg-purple-500',
            badge: 'bg-purple-500/20 text-purple-100',
            primaryBtn: 'bg-white text-purple-700 hover:bg-purple-50',
            secondaryBtn: 'border border-white/60 text-white hover:bg-white/10',
        },
        CHURCH: {
            actionBg: 'bg-amber-700',
            actionBgDark: 'dark:bg-amber-900',
            actionText: 'text-white',
            accentBg: 'bg-amber-500',
            badge: 'bg-amber-500/20 text-amber-100',
            primaryBtn: 'bg-white text-amber-700 hover:bg-amber-50',
            secondaryBtn: 'border border-white/60 text-white hover:bg-white/10',
        },
        EVENT: {
            actionBg: 'bg-rose-700',
            actionBgDark: 'dark:bg-rose-900',
            actionText: 'text-white',
            accentBg: 'bg-rose-500',
            badge: 'bg-rose-500/20 text-rose-100',
            primaryBtn: 'bg-white text-rose-700 hover:bg-rose-50',
            secondaryBtn: 'border border-white/60 text-white hover:bg-white/10',
        },
        PROMOTION: {
            actionBg: 'bg-emerald-700',
            actionBgDark: 'dark:bg-emerald-900',
            actionText: 'text-white',
            accentBg: 'bg-emerald-500',
            badge: 'bg-emerald-500/20 text-emerald-100',
            primaryBtn: 'bg-white text-emerald-700 hover:bg-emerald-50',
            secondaryBtn: 'border border-white/60 text-white hover:bg-white/10',
        },
    },
} as const;
