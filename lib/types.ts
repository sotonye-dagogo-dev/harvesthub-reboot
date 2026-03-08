/**
 * HarvestHub Type System
 * Comprehensive type definitions for the entire application
 * All types are globally available via tsconfig.json
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
} from '@/lib/constants';

// ============================================================================
// BASE TYPES
// ============================================================================

export type ID = string;
export type Timestamp = Date | string;
export type Email = string;
export type PhoneNumber = string;
export type URL = string;

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
    id: ID;
    email: Email;
    password?: string; // Only present in database, never exposed to client
    firstName: string;
    lastName: string;
    phoneNumber: PhoneNumber;
    role: UserRole;
    profilePicture?: URL | null;
    emailVerified: boolean;
    isActive: boolean;
    status?: 'ACTIVE' | 'INACTIVE' | 'BANNED' | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Password reset fields
    resetToken?: string | null;
    resetTokenExpiry?: Timestamp | null;

    // Relations
    buyer?: Buyer | null;
    vendor?: Vendor | null;
    addresses?: Address[];
}

export interface Buyer {
    id: ID;
    userId: ID;
    dateOfBirth?: Timestamp | null;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
    preferences?: BuyerPreferences | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Relations
    user?: User;
    cart?: Cart | null;
    orders?: Order[];
    wallet?: Wallet | null;
    reviews?: Review[];
}

export interface BuyerPreferences {
    notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
    defaultCampus?: Campus | null;
    defaultDeliveryMethod?: DeliveryMethod | null;
}

// ============================================================================
// VENDOR TYPES
// ============================================================================

export interface Vendor {
    id: ID;
    userId: ID;
    storeName: string;
    storeDescription?: string | null;
    category: VendorCategory;
    whatsappNumber: PhoneNumber;
    campus: Campus;
    position?: Position | null;
    status: VendorStatus;
    isChurchAffiliated: boolean;
    commissionRate: number;
    storeLogo?: URL | null;
    storeBanner?: URL | null;
    businessVerification?: BusinessVerification | null;
    storeSettings: VendorStoreSettings;
    analytics: VendorAnalytics;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Relations
    user?: User;
    products?: Product[];
    orders?: Order[];
    wallet?: Wallet | null;
}

export interface BusinessVerification {
    businessName?: string | null;
    businessRegistrationNumber?: string | null;
    taxId?: string | null;
    verificationDocuments?: URL[] | null;
    verifiedAt?: Timestamp | null;
    verifiedBy?: ID | null;
}

export interface VendorStoreSettings {
    allowsPickup: boolean;
    allowsDelivery: boolean;
    pickupServices: PickupService[];
    deliveryZones: number[];
    businessHours?: string | null;
    policies?: {
        returnPolicy?: string | null;
        shippingPolicy?: string | null;
        privacyPolicy?: string | null;
    };
}

export interface VendorAnalytics {
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    averageRating: number;
    totalReviews: number;
    conversionRate: number;
    lastUpdated: Timestamp;
}

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export interface Product {
    id: ID;
    vendorId: ID;
    name: string;
    description: string;
    category: ProductCategory;
    price: number;
    compareAtPrice?: number | null;
    discount?: number; // Discount percentage (0-100)
    stock: number;
    images: URL[];
    mainImage: URL;
    variants?: ProductVariant[] | null;
    tags?: string[] | null;
    isActive: boolean;
    isFeatured: boolean;
    views: number;
    sales: number;
    averageRating: number;
    totalReviews: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Relations
    vendor?: Vendor;
    reviews?: Review[];
    orderItems?: OrderItem[];
    cartItems?: CartItem[];
}

export interface ProductVariant {
    id: ID;
    name: string;
    values: string[];
    priceAdjustment?: number | null;
}

// ============================================================================
// CART TYPES
// ============================================================================

export interface Cart {
    id: ID;
    buyerId: ID;
    items: CartItem[];
    subtotal: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Relations
    buyer?: Buyer;
}

export interface CartItem {
    id: ID;
    cartId: ID;
    productId: ID;
    quantity: number;
    selectedVariants?: Record<string, string> | null;
    price: number;
    subtotal: number;
    addedAt: Timestamp;

    // Relations
    cart?: Cart;
    product?: Product;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export interface Order {
    id: ID;
    orderNumber: string;
    buyerId: ID;
    vendorId: ID;
    status: OrderStatus;
    items: OrderItem[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    deliveryMethod: DeliveryMethod;
    deliveryAddress?: Address | null;
    pickupDetails?: PickupDetails | null;
    notes?: string | null;
    statusHistory: OrderStatusHistory[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
    completedAt?: Timestamp | null;

    // Relations
    buyer?: Buyer;
    vendor?: Vendor;
}

export interface OrderItem {
    id: ID;
    orderId: ID;
    productId: ID;
    productName: string;
    productImage: URL;
    quantity: number;
    selectedVariants?: Record<string, string> | null;
    price: number;
    subtotal: number;

    // Relations
    order?: Order;
    product?: Product;
}

export interface PickupDetails {
    campus: Campus;
    service: PickupService;
    contactPhone: PhoneNumber;
    specialInstructions?: string | null;
}

export interface OrderStatusHistory {
    status: OrderStatus;
    notes?: string | null;
    timestamp: Timestamp;
    updatedBy: ID;
}

// ============================================================================
// ADDRESS TYPES
// ============================================================================

export interface Address {
    id: ID;
    userId: ID;
    label: string;
    fullName: string;
    phoneNumber: PhoneNumber;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    campus?: Campus | null;
    landmark?: string | null;
    isDefault: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Relations
    user?: User;
}

// ============================================================================
// WALLET & TRANSACTION TYPES
// ============================================================================

export interface Wallet {
    id: ID;
    userId: ID;
    balance: number;
    currency: string;
    isActive: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Relations
    user?: User;
    transactions?: Transaction[];
}

export interface Transaction {
    id: ID;
    walletId: ID;
    type: TransactionType;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    status: TransactionStatus;
    reference: string;
    description: string;
    metadata?: Record<string, unknown> | null;
    orderId?: ID | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Relations
    wallet?: Wallet;
    order?: Order | null;
}

// ============================================================================
// REVIEW TYPES
// ============================================================================

export interface Review {
    id: ID;
    productId: ID;
    buyerId: ID;
    orderId: ID;
    rating: number;
    comment?: string | null;
    images?: URL[] | null;
    photos?: URL[] | null; // Alias for images
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    notHelpfulCount: number; // Count of "not helpful" votes
    unhelpfulCount?: number;
    isFlagged?: boolean; // Whether review is flagged for moderation
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Denormalized fields for display
    userName?: string;
    productName?: string;

    // Relations
    product?: Product;
    buyer?: Buyer;
    order?: Order;
}

// ============================================================================
// BANNER TYPES
// ============================================================================

/**
 * A single call-to-action that can be attached to a banner.
 * Multiple actions allow for primary/secondary button configurations.
 */
export interface BannerAction {
    /** Label shown on the button */
    label: string;
    /** URL to navigate to when clicked */
    href: string;
    /** Visual variant – drives button styling */
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    /** Open in new tab */
    openInNewTab?: boolean;
    /** Optional icon name (lucide-react) */
    icon?: string;
}

/**
 * The thematic category of a banner, used to apply tailored styling.
 * - BUSINESS   → general commercial / product ads
 * - CHURCH     → church-programme announcements (warm, faith-oriented palette)
 * - EVENT      → one-off occasions with a date/time emphasis
 * - PROMOTION  → discount & sale themes
 */
export type BannerTheme = 'BUSINESS' | 'CHURCH' | 'EVENT' | 'PROMOTION';

export interface Banner {
    id: ID;
    title: string;
    /** Short tagline shown in the action panel / modal */
    subtitle?: string | null;
    description?: string | null;
    imageUrl: URL;
    /**
     * @deprecated Use `actions` array instead.
     * Kept for backward-compatibility with consumers that only need a single link.
     */
    linkUrl?: URL | null;
    /** Structured call-to-action buttons (up to 2 recommended) */
    actions?: BannerAction[] | null;
    /** Determines slot placement */
    position: 'TOP' | 'HERO' | 'SIDEBAR';
    /**
     * Visual theme applied to the banner.
     * Defaults to 'BUSINESS' when omitted.
     */
    theme?: BannerTheme | null;
    /**
     * Accent / overlay colour used in the action panel.
     * Accepts any valid CSS colour string (hex, hsl, rgb…).
     * Falls back to the theme's default when omitted.
     */
    accentColor?: string | null;
    /**
     * Extra detail displayed in the action panel / modal.
     * Useful for address, date/time, or speaker info on church banners.
     */
    details?: string | null;
    /**
     * Label for the "know more" affordance on small screens.
     * Defaults to "Know More" when omitted.
     */
    knowMoreLabel?: string | null;
    isActive: boolean;
    startDate: Timestamp;
    endDate?: Timestamp | null;
    displayOrder: number;
    targetAudience?: UserRole[] | null;
    clickCount: number;
    impressionCount: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: ID;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType =
    | "ORDER_CONFIRMED"
    | "ORDER_READY"
    | "ORDER_DELIVERED"
    | "ORDER_CANCELLED"
    | "PAYMENT_SUCCESS"
    | "PAYMENT_FAILED"
    | "DELIVERY_UPDATE"
    | "VENDOR_MESSAGE"
    | "LOW_STOCK"
    | "NEW_PRODUCT"
    | "PROMOTION";

export interface Notification {
    id: ID;
    userId: ID;
    type: NotificationType;
    title: string;
    message: string;
    link?: URL | null;
    isRead: boolean;
    metadata?: Record<string, unknown> | null;
    createdAt: Timestamp;
    updatedAt?: Timestamp;

    // Relations
    user?: User;
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface LoginFormData {
    email: Email;
    password: string;
}

export interface RegisterFormData {
    email: Email;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phoneNumber: PhoneNumber;
    role: UserRole.BUYER | UserRole.VENDOR;
    agreeToTerms: boolean;

    // Vendor-specific fields
    storeName?: string;
    storeCategory?: VendorCategory;
    whatsappNumber?: PhoneNumber;
    campus?: Campus;
    position?: Position;
}

export interface UserFormData {
    email: Email;
    firstName: string;
    lastName: string;
    phoneNumber: PhoneNumber;
    dateOfBirth?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';

    // Signup flow specific fields (matching app/types/index.ts)
    userType?: 'buyer' | 'vendor';
    storeName?: string;
    storeType?: 'retail' | 'wholesale' | 'manufacturing' | 'service';
    storeCategory?: string;
    campus?: string;
    position?: string;
    storeDescription?: string;
    businessAddress?: string;
    username?: string;
    bio?: string;
    profilePicture?: {
        filename: string;
        url: string;
    } | null;
    password?: string;
    agreement?: boolean;
}

export interface ProductFormData {
    name: string;
    description: string;
    category: ProductCategory;
    price: number;
    compareAtPrice?: number;
    stock: number;
    images: File[] | URL[];
    variants?: ProductVariant[];
    tags?: string[];
    isActive: boolean;
    isFeatured: boolean;
}

export interface OrderFormData {
    items: {
        productId: ID;
        quantity: number;
        selectedVariants?: Record<string, string>;
    }[];
    deliveryMethod: DeliveryMethod;
    paymentMethod: PaymentMethod;
    addressId?: ID;
    pickupDetails?: Omit<PickupDetails, 'campus'> & { campus?: Campus };
    notes?: string;
}

export interface ReviewFormData {
    productId: ID;
    orderId: ID;
    rating: number;
    comment?: string;
    images?: File[];
}

export interface AddressFormData {
    label: string;
    fullName: string;
    phoneNumber: PhoneNumber;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    campus?: Campus;
    landmark?: string;
    isDefault: boolean;
}

export interface WalletDepositFormData {
    amount: number;
    paymentMethod: PaymentMethod;
}

export interface WalletWithdrawalFormData {
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
}

export interface VendorStoreFormData {
    storeName: string;
    storeDescription?: string;
    category: VendorCategory;
    whatsappNumber: PhoneNumber;
    campus: Campus;
    position?: Position;
    allowsPickup: boolean;
    allowsDelivery: boolean;
    pickupServices?: PickupService[];
    deliveryZones?: number[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T = unknown> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
    message?: string;
}

export interface ApiError {
    success: false;
    error: string;
    message: string;
    statusCode: number;
    details?: Record<string, unknown>;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthUser extends User {
    buyer?: Buyer | null;
    vendor?: Vendor | null;
}

export interface JWTPayload {
    userId: ID;
    email: Email;
    role: UserRole;
    iat?: number;
    exp?: number;
}

// ============================================================================
// SEARCH & FILTER TYPES
// ============================================================================

export interface ProductFilters {
    category?: ProductCategory;
    minPrice?: number;
    maxPrice?: number;
    vendorId?: ID;
    campus?: Campus;
    rating?: number;
    inStock?: boolean;
    isFeatured?: boolean;
    tags?: string[];
    search?: string;
}

export interface OrderFilters {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    deliveryMethod?: DeliveryMethod;
    startDate?: Timestamp;
    endDate?: Timestamp;
    vendorId?: ID;
    buyerId?: ID;
}

export interface VendorFilters {
    category?: VendorCategory;
    campus?: Campus;
    status?: VendorStatus;
    search?: string;
    isChurchAffiliated?: boolean;
}

export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
    field: string;
    order: SortOrder;
}

export interface PaginationOptions {
    page: number;
    pageSize: number;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface SalesAnalytics {
    period: 'day' | 'week' | 'month' | 'year';
    revenue: number;
    orders: number;
    averageOrderValue: number;
    topProducts: Array<{
        productId: ID;
        productName: string;
        sales: number;
        revenue: number;
    }>;
    revenueByCategory: Record<ProductCategory, number>;
    ordersByStatus: Record<OrderStatus, number>;
}

export interface VendorPerformance {
    vendorId: ID;
    storeName: string;
    totalRevenue: number;
    totalOrders: number;
    averageRating: number;
    completionRate: number;
    responseTime: number;
    period: string;
}

export interface PlatformAnalytics {
    totalUsers: number;
    totalVendors: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    activeUsers: number;
    newUsers: number;
    period: string;
}

export {
    UserRole,
    OrderStatus,
    PaymentStatus,
    PaymentMethod,
    DeliveryMethod,
    PickupService,
    Campus,
    VendorCategory,
    ProductCategory,
    TransactionType,
    TransactionStatus,
    VendorStatus,
};