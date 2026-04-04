/**
 * MyHarvestHub Type System
 * Comprehensive type definitions for the entire application
 * All types are globally available via tsconfig.json
 */

import type {
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
    UserStatus,
    Gender,
    BannerPosition,
    ReviewStatus,
    BugReportCategory,
    BugReportPriority,
    BugReportStatus,
    ListingType,
    ServiceCategory,
    ServiceRateType,
    ServiceLocation,
    BookingStatus,
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

    // Email verification fields
    emailVerificationToken?: string | null;
    emailVerificationExpiry?: Timestamp | null;

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
    listingType: ListingType;
    price: number;
    compareAtPrice?: number | null;
    discount?: number; // Discount percentage (0-100)
    stock: number; // For services, use SERVICE_UNLIMITED_STOCK sentinel
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

    // Service-specific fields (only when listingType === SERVICE)
    serviceDetails?: ServiceDetails | null;

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

export interface AdApplication {
    id: ID;
    userId?: ID | null;
    name: string;
    email: Email;
    phoneNumber: PhoneNumber;
    companyName?: string | null;
    title: string;
    description: string;
    imageUrl: URL;
    linkUrl?: URL | null;
    position: 'TOP' | 'HERO' | 'SIDEBAR';
    theme?: 'BUSINESS' | 'CHURCH' | 'EVENT' | 'PROMOTION' | null;
    requestedStart: Timestamp;
    requestedEnd?: Timestamp | null;
    status: 'PENDING' | 'PENDING_PAYMENT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'EXPIRED';
    paymentMethod?: 'BANK_TRANSFER' | 'CARD' | 'USSD' | null;
    amountPaid?: number | null;
    proofOfTransferUrl?: URL | null;
    durationType?: 'HOURLY' | 'DAILY' | null;
    durationValue?: number | null;
    activeUntil?: Timestamp | null;
    reviewComment?: string | null;
    reviewedBy?: ID | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
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
    whatsappNumber?: string;
    campus?: string;
    position?: string;
    storeDescription?: string;
    businessAddress?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    serviceCategory?: string;
    isChurchAffiliated?: boolean;
    serviceLocation?: string;
    username?: string;
    bio?: string;
    profilePicture?: {
        filename: string;
        url: string;
    } | null;
    verificationDocuments?: {
        documentType?: 'ID' | 'BUSINESS_REGISTRATION' | 'UTILITY_BILL';
        filename: string;
        url: string;
        publicId?: string;
    }[];
    idType?: string;
    password?: string;
    agreement?: boolean;
}

export interface ProductFormData {
    name: string;
    description: string;
    category: ProductCategory;
    listingType: ListingType;
    price: number;
    compareAtPrice?: number;
    stock?: number; // Optional for services (auto-set to SERVICE_UNLIMITED_STOCK)
    images: File[] | URL[];
    variants?: ProductVariant[];
    tags?: string[];
    isActive: boolean;
    isFeatured: boolean;
    serviceDetails?: ServiceFormData;
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
// SERVICE & BOOKING TYPES
// ============================================================================

export interface ServiceDetails {
    serviceCategory: ServiceCategory;
    rateType: ServiceRateType;
    rate: number;
    durationMinutes?: number | null;
    location: ServiceLocation;
    availableSlots?: WeeklySlot[] | null;
    requiresConsultation: boolean;
    maxBookingsPerDay?: number | null;
}

export interface WeeklySlot {
    id: ID;
    dayOfWeek: number; // 0 = Sunday, 6 = Saturday
    startTime: string; // "09:00"
    endTime: string;   // "10:00"
    isAvailable: boolean;
}

export interface Booking {
    id: ID;
    serviceId: ID;
    buyerId: ID;
    vendorId: ID;
    scheduledDate: Timestamp;
    scheduledTime: string;
    durationMinutes: number;
    status: BookingStatus;
    notes?: string | null;
    orderId?: ID | null;
    price: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Relations
    service?: Product;
    buyer?: Buyer;
    vendor?: Vendor;
    order?: Order;
}

export interface BookingFormData {
    serviceId: ID;
    scheduledDate: string; // ISO date string
    scheduledTime: string; // "09:00"
    notes?: string;
}

export interface ServiceFormData {
    serviceCategory: ServiceCategory;
    rateType: ServiceRateType;
    rate: number;
    durationMinutes?: number;
    location: ServiceLocation;
    availableSlots?: Omit<WeeklySlot, 'id'>[];
    requiresConsultation?: boolean;
    maxBookingsPerDay?: number;
}

// ============================================================================
// PLATFORM SETTINGS TYPES
// ============================================================================

export interface PlatformCommissionTier {
    id: string;
    label: string;
    rate: number;
    description: string;
}

export interface PlatformSettings {
    commissionTiers: PlatformCommissionTier[];
    defaultCommissionRate: number;
    minOrderAmount: number;
    maxBookingAdvanceDays: number;
    paymentsEnabled: boolean;
    paymentNotice: string;
    updatedAt: Timestamp;
    updatedBy?: ID | null;
}

// ============================================================================
// VENDOR MARKETING CONTENT TYPES
// ============================================================================

export type VendorContentType = 'IMAGE' | 'VIDEO' | 'TEXT' | 'PROMO_BANNER';
export type VendorContentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'EXPIRED';

export interface VendorContent {
    id: ID;
    vendorId: ID;
    type: VendorContentType;
    title: string;
    description?: string | null;
    mediaUrl?: string | null;
    mediaPublicId?: string | null;
    textContent?: string | null;
    status: VendorContentStatus;
    rejectionReason?: string | null;
    usageRights: boolean;
    targetPlatform?: string | null;
    validFrom?: Timestamp | null;
    validTo?: Timestamp | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    vendor?: Vendor;
}

export interface VendorContentFormData {
    type: VendorContentType;
    title: string;
    description?: string;
    mediaUrl?: string;
    textContent?: string;
    usageRights: boolean;
    targetPlatform?: string;
    validFrom?: string;
    validTo?: string;
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
    listingType?: ListingType;
    serviceCategory?: ServiceCategory;
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

// ============================================================================
// AVAILABILITY REQUEST TYPES
// ============================================================================

export type AvailabilityRequestStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'EXPIRED';

export interface AvailabilityRequestItem {
    productId: ID;
    quantity: number;
    productName: string;
}

export interface AvailabilityRequest {
    id: ID;
    buyerId: ID;
    vendorId: ID;
    items: AvailabilityRequestItem[];
    buyerNote?: string | null;
    status: AvailabilityRequestStatus;
    vendorResponse?: string | null;
    respondedAt?: Timestamp | null;
    expiresAt: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ============================================================================
// AD TYPES
// ============================================================================

export type AdStatus = 'PENDING_PAYMENT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'EXPIRED' | 'PAUSED';

export interface Ad {
    id: ID;
    userId: ID;
    title: string;
    subtitle?: string | null;
    ctaText?: string | null;
    ctaLink?: string | null;
    imageUrl: string;
    imagePublicId?: string | null;
    dailyRate: number;
    totalCost: number;
    startDate: Timestamp;
    endDate: Timestamp;
    duration: number;
    status: AdStatus;
    rejectionReason?: string | null;
    paymentVerified: boolean;
    impressions: number;
    clicks: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ============================================================================
// MILESTONE TYPES
// ============================================================================

export type MilestoneType =
    | 'FIRST_1000_VENDORS'
    | 'FIRST_1000_BUYERS'
    | 'FIRST_PURCHASE'
    | 'FIRST_SALE'
    | 'FIRST_REVIEW'
    | 'VENDOR_100_SALES'
    | 'CUSTOM';

export interface MilestoneRecord {
    id: ID;
    userId: ID;
    milestoneType: MilestoneType;
    label: string;
    achievedAt: string;
    metadata?: Record<string, unknown>;
}

// ============================================================================
// VOUCHER TYPES
// ============================================================================

export type VoucherTypeValue = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_DELIVERY';

export interface Voucher {
    id: ID;
    code: string;
    type: VoucherTypeValue;
    value: number;
    minOrderAmount: number;
    maxDiscount?: number | null;
    usageLimit?: number | null;
    usedCount: number;
    perUserLimit: number;
    validFrom: Timestamp;
    validTo: Timestamp;
    isActive: boolean;
    applicableCategories: string[];
    applicableVendors: string[];
    createdBy: ID;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface VoucherRedemption {
    id: ID;
    voucherId: ID;
    userId: ID;
    orderId?: ID | null;
    discountApplied: number;
    redeemedAt: Timestamp;
}

// ============================================================================
// PROOF OF TRANSFER TYPES
// ============================================================================

export type ProofOfTransferStatusValue = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface ProofOfTransfer {
    id: ID;
    orderId?: ID | null;
    userId: ID;
    imageUrl: string;
    imagePublicId?: string | null;
    bankReference?: string | null;
    amount: number;
    status: ProofOfTransferStatusValue;
    verifiedBy?: ID | null;
    verifiedAt?: Timestamp | null;
    notes?: string | null;
    createdAt: Timestamp;
}

// ============================================================================
// PUSH SUBSCRIPTION TYPES
// ============================================================================

export interface PushSubscriptionRecord {
    id: ID;
    userId: ID;
    endpoint: string;
    p256dh: string;
    auth: string;
    createdAt: Timestamp;
}

export interface NotificationPreference {
    id: ID;
    userId: ID;
    orderUpdates: boolean;
    promotions: boolean;
    vendorMessages: boolean;
    lowStock: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ============================================================================
// ADVERTISER PAYMENT TYPES
// ============================================================================

export interface AdvertiserPayment {
    id: ID;
    adId: ID;
    userId: ID;
    amount: number;
    proofImageUrl?: string | null;
    proofPublicId?: string | null;
    bankReference?: string | null;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    verifiedBy?: ID | null;
    verifiedAt?: Timestamp | null;
    createdAt: Timestamp;
}

// ============================================================================
// BUG REPORT TYPES
// ============================================================================

export type BugReportCategoryValue = 'UI_ISSUE' | 'PAYMENT' | 'ORDER' | 'ACCOUNT' | 'PERFORMANCE' | 'OTHER';
export type BugReportPriorityValue = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type BugReportStatusValue = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface BugReport {
    id: ID;
    category: BugReportCategoryValue;
    priority: BugReportPriorityValue;
    status: BugReportStatusValue;
    subject: string;
    details: string;
    email: Email;
    userId?: ID | null;
    screenshotUrl?: string | null;
    screenshotPublicId?: string | null;
    adminNotes?: string | null;
    resolvedBy?: ID | null;
    resolvedAt?: Timestamp | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface BugReportFormData {
    category: BugReportCategoryValue;
    priority: BugReportPriorityValue;
    subject: string;
    details: string;
    email: string;
    screenshot?: string | null;
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
    UserStatus,
    Gender,
    BannerPosition,
    ReviewStatus,
    BugReportCategory,
    BugReportPriority,
    BugReportStatus,
    ListingType,
    ServiceCategory,
    ServiceRateType,
    ServiceLocation,
    BookingStatus,
};
