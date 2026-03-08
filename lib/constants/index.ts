/**
 * MyHarvestHub Platform Constants
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
    READY_FOR_PICKUP = 'READY_FOR_PICKUP',
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
    DELIVERED = 'DELIVERED',
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
    BANK_TRANSFER_PROOF = 'BANK_TRANSFER_PROOF',
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
    LONDON = 'LONDON',
    BIRMINGHAM = 'BIRMINGHAM',
    GLASGOW = 'GLASGOW',
    MANCHESTER = 'MANCHESTER',
    HOUSTON = 'HOUSTON',
    NORTH_LONDON = 'NORTH_LONDON',
    KENT = 'KENT',
    TORONTO = 'TORONTO',
    GBAGADA = 'GBAGADA',
    MAGODO = 'MAGODO',
    IKORODU = 'IKORODU',
    IBADAN_JERICHO = 'IBADAN_JERICHO',
    AKOBO = 'AKOBO',
    APAPA = 'APAPA',
    SURULERE = 'SURULERE',
    ABEOKUTA = 'ABEOKUTA',
    ILUPEJU = 'ILUPEJU',
    YABA = 'YABA',
    PORT_HARCOURT = 'PORT_HARCOURT',
    OLUYOLE = 'OLUYOLE',
    OGBA = 'OGBA',
    ANTHONY = 'ANTHONY',
    ALIMOSHO = 'ALIMOSHO',
    IKEJA = 'IKEJA',
    IKOYI = 'IKOYI',
    ISOLO = 'ISOLO',
    IYANA_IPAJA = 'IYANA_IPAJA',
    ABULE_EGBA = 'ABULE_EGBA',
    GHANA = 'GHANA',
    ABUJA = 'ABUJA',
    LEKKI = 'LEKKI',
    GLOBE = 'GLOBE',
    AJAH = 'AJAH',
    ONLINE = 'ONLINE',
}

export enum Position {
    HOD = 'HOD',
    ASST_HOD = 'ASST_HOD',
    SUB_TEAM_LEADER = 'SUB_TEAM_LEADER',
    TEAM_LEAD = 'TEAM_LEAD',
    SMALL_GROUP_LEADER = 'SMALL_GROUP_LEADER',
    ASST_SMALL_GROUP_LEADER = 'ASST_SMALL_GROUP_LEADER',
    ZONAL_COORDINATOR = 'ZONAL_COORDINATOR',
    COMMUNITY_LEADER = 'COMMUNITY_LEADER',
    DISTRICT_PASTOR = 'DISTRICT_PASTOR',
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

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    BANNED = 'BANNED',
}

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',
}

export enum BannerPosition {
    TOP = 'TOP',
    HERO = 'HERO',
    SIDEBAR = 'SIDEBAR',
}

export enum BannerTheme {
    BUSINESS = 'BUSINESS',
    CHURCH = 'CHURCH',
    EVENT = 'EVENT',
    PROMOTION = 'PROMOTION',
}

export enum ReviewStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export enum AvailabilityRequestStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    DECLINED = 'DECLINED',
    EXPIRED = 'EXPIRED',
}

export enum AdStatus {
    PENDING_PAYMENT = 'PENDING_PAYMENT',
    PENDING_APPROVAL = 'PENDING_APPROVAL',
    APPROVED = 'APPROVED',
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    REJECTED = 'REJECTED',
}

export enum AdPaymentStatus {
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
    REJECTED = 'REJECTED',
}

export enum ProofOfTransferStatus {
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
    REJECTED = 'REJECTED',
}

export enum VoucherType {
    PERCENTAGE = 'PERCENTAGE',
    FIXED_AMOUNT = 'FIXED_AMOUNT',
    FREE_DELIVERY = 'FREE_DELIVERY',
}

export enum MilestoneType {
    FIRST_1000_VENDORS = 'FIRST_1000_VENDORS',
    FIRST_1000_BUYERS = 'FIRST_1000_BUYERS',
    FIRST_PURCHASE = 'FIRST_PURCHASE',
    FIRST_SALE = 'FIRST_SALE',
    FIRST_REVIEW = 'FIRST_REVIEW',
    VENDOR_100_SALES = 'VENDOR_100_SALES',
    CUSTOM = 'CUSTOM',
}

export enum NotificationType {
    ORDER_CONFIRMED = 'ORDER_CONFIRMED',
    ORDER_READY = 'ORDER_READY',
    ORDER_DELIVERED = 'ORDER_DELIVERED',
    ORDER_CANCELLED = 'ORDER_CANCELLED',
    PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    DELIVERY_UPDATE = 'DELIVERY_UPDATE',
    VENDOR_MESSAGE = 'VENDOR_MESSAGE',
    LOW_STOCK = 'LOW_STOCK',
    NEW_PRODUCT = 'NEW_PRODUCT',
    PROMOTION = 'PROMOTION',
}

// ============================================================================
// CAMPUS LOCATIONS
// ============================================================================

export const CAMPUS_LOCATIONS = [
    { value: Campus.LONDON, label: 'London' },
    { value: Campus.BIRMINGHAM, label: 'Birmingham' },
    { value: Campus.GLASGOW, label: 'Glasgow' },
    { value: Campus.MANCHESTER, label: 'Manchester' },
    { value: Campus.HOUSTON, label: 'Houston' },
    { value: Campus.NORTH_LONDON, label: 'North London' },
    { value: Campus.KENT, label: 'Kent' },
    { value: Campus.TORONTO, label: 'Toronto' },
    { value: Campus.GBAGADA, label: 'Gbagada' },
    { value: Campus.MAGODO, label: 'Magodo' },
    { value: Campus.IKORODU, label: 'Ikorodu' },
    { value: Campus.IBADAN_JERICHO, label: 'Ibadan Jericho' },
    { value: Campus.AKOBO, label: 'Akobo' },
    { value: Campus.APAPA, label: 'Apapa' },
    { value: Campus.SURULERE, label: 'Surulere' },
    { value: Campus.ABEOKUTA, label: 'Abeokuta' },
    { value: Campus.ILUPEJU, label: 'Ilupeju' },
    { value: Campus.YABA, label: 'Yaba' },
    { value: Campus.PORT_HARCOURT, label: 'Port Harcourt' },
    { value: Campus.OLUYOLE, label: 'Oluyole' },
    { value: Campus.OGBA, label: 'Ogba' },
    { value: Campus.ANTHONY, label: 'Anthony' },
    { value: Campus.ALIMOSHO, label: 'Alimosho' },
    { value: Campus.IKEJA, label: 'Ikeja' },
    { value: Campus.IKOYI, label: 'Ikoyi' },
    { value: Campus.ISOLO, label: 'Isolo' },
    { value: Campus.IYANA_IPAJA, label: 'Iyana Ipaja' },
    { value: Campus.ABULE_EGBA, label: 'Abule Egba' },
    { value: Campus.GHANA, label: 'Ghana' },
    { value: Campus.ABUJA, label: 'Abuja' },
    { value: Campus.LEKKI, label: 'Lekki' },
    { value: Campus.GLOBE, label: 'Globe' },
    { value: Campus.AJAH, label: 'Ajah' },
    { value: Campus.ONLINE, label: 'Online' },
] as const;

// ============================================================================
// POSITION OPTIONS
// ============================================================================

export const POSITION_OPTIONS = [
    { value: Position.HOD, label: 'HOD' },
    { value: Position.ASST_HOD, label: 'Ass. HOD' },
    { value: Position.SUB_TEAM_LEADER, label: 'Sub Team Leader' },
    { value: Position.TEAM_LEAD, label: 'Team Lead' },
    { value: Position.SMALL_GROUP_LEADER, label: 'Small Group Leader' },
    { value: Position.ASST_SMALL_GROUP_LEADER, label: 'Ass. Small Group Leader' },
    { value: Position.ZONAL_COORDINATOR, label: 'Zonal Coordinator' },
    { value: Position.COMMUNITY_LEADER, label: 'Community Leader' },
    { value: Position.DISTRICT_PASTOR, label: 'District Pastor' },
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
        description: 'Professional & freelance services (grooming, creative, digital, etc.)',
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
    [OrderStatus.PROCESSING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
    [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
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
// LISTING TYPES
// ============================================================================

export enum ListingType {
    PRODUCT = 'PRODUCT',
    SERVICE = 'SERVICE',
}

export const LISTING_TYPES = [
    { value: ListingType.PRODUCT, label: 'Physical Product', description: 'Tangible goods for sale' },
    { value: ListingType.SERVICE, label: 'Service', description: 'Service offering with booking' },
] as const;

// ============================================================================
// SERVICE ENUMS & CONSTANTS
// ============================================================================

export enum ServiceCategory {
    GROOMING = 'GROOMING',
    BEAUTY_WELLNESS = 'BEAUTY_WELLNESS',
    CREATIVE = 'CREATIVE',
    DIGITAL = 'DIGITAL',
    WRITING_TRANSLATION = 'WRITING_TRANSLATION',
    TUTORING_COACHING = 'TUTORING_COACHING',
    HOME_SERVICES = 'HOME_SERVICES',
    FOOD_CATERING = 'FOOD_CATERING',
    EVENTS = 'EVENTS',
    FASHION_TAILORING = 'FASHION_TAILORING',
    FITNESS = 'FITNESS',
    CONSULTING = 'CONSULTING',
    OTHER_SERVICE = 'OTHER_SERVICE',
}

export const SERVICE_CATEGORIES = [
    { value: ServiceCategory.GROOMING, label: 'Grooming', description: 'Barbing, hairdressing, shaving' },
    { value: ServiceCategory.BEAUTY_WELLNESS, label: 'Beauty & Wellness', description: 'Makeup, spa, skincare treatments' },
    { value: ServiceCategory.CREATIVE, label: 'Creative', description: 'Photography, videography, content creation' },
    { value: ServiceCategory.DIGITAL, label: 'Digital Services', description: 'Web development, graphic design, social media' },
    { value: ServiceCategory.WRITING_TRANSLATION, label: 'Writing & Translation', description: 'Copywriting, editing, translation' },
    { value: ServiceCategory.TUTORING_COACHING, label: 'Tutoring & Coaching', description: 'Academic tutoring, mentoring, life coaching' },
    { value: ServiceCategory.HOME_SERVICES, label: 'Home Services', description: 'Cleaning, repairs, laundry, plumbing' },
    { value: ServiceCategory.FOOD_CATERING, label: 'Food & Catering', description: 'Catering, meal prep, baking' },
    { value: ServiceCategory.EVENTS, label: 'Events', description: 'Event planning, decoration, DJ, MC' },
    { value: ServiceCategory.FASHION_TAILORING, label: 'Fashion & Tailoring', description: 'Tailoring, alterations, custom clothing' },
    { value: ServiceCategory.FITNESS, label: 'Fitness & Training', description: 'Personal training, yoga, sports coaching' },
    { value: ServiceCategory.CONSULTING, label: 'Consulting', description: 'Business, career, financial consulting' },
    { value: ServiceCategory.OTHER_SERVICE, label: 'Other Services', description: 'Other professional services' },
] as const;

export enum ServiceRateType {
    FIXED = 'FIXED',
    HOURLY = 'HOURLY',
    PER_SESSION = 'PER_SESSION',
    STARTING_FROM = 'STARTING_FROM',
    CUSTOM = 'CUSTOM',
}

export const SERVICE_RATE_TYPES = [
    { value: ServiceRateType.FIXED, label: 'Fixed Price', description: 'One-time fixed fee' },
    { value: ServiceRateType.HOURLY, label: 'Per Hour', description: 'Charged by the hour' },
    { value: ServiceRateType.PER_SESSION, label: 'Per Session', description: 'Charged per session' },
    { value: ServiceRateType.STARTING_FROM, label: 'Starting From', description: 'Base price, may vary' },
    { value: ServiceRateType.CUSTOM, label: 'Custom Quote', description: 'Price on request' },
] as const;

export enum ServiceLocation {
    ON_SITE = 'ON_SITE',
    REMOTE = 'REMOTE',
    BOTH = 'BOTH',
}

export const SERVICE_LOCATIONS = [
    { value: ServiceLocation.ON_SITE, label: 'On-Site', description: 'Service provided at a physical location' },
    { value: ServiceLocation.REMOTE, label: 'Remote', description: 'Service provided online/remotely' },
    { value: ServiceLocation.BOTH, label: 'Both', description: 'Available on-site and remotely' },
] as const;

export enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW',
}

export const BOOKING_STATUSES = [
    { value: BookingStatus.PENDING, label: 'Pending', color: 'gold' },
    { value: BookingStatus.CONFIRMED, label: 'Confirmed', color: 'blue' },
    { value: BookingStatus.IN_PROGRESS, label: 'In Progress', color: 'processing' },
    { value: BookingStatus.COMPLETED, label: 'Completed', color: 'green' },
    { value: BookingStatus.CANCELLED, label: 'Cancelled', color: 'red' },
    { value: BookingStatus.NO_SHOW, label: 'No Show', color: 'default' },
] as const;

/** Sentinel value for services: they have no physical stock. */
export const SERVICE_UNLIMITED_STOCK = 999999;

// ============================================================================
// PLATFORM SETTINGS DEFAULTS
// ============================================================================

export const PLATFORM_DEFAULTS = {
    /** Commission tiers (percentage as decimal) */
    COMMISSION_DEFAULT: 0.05,
    COMMISSION_PREMIUM: 0.03,
    COMMISSION_CHURCH: 0.02,
    /** Minimum order amount in NGN */
    MIN_ORDER_AMOUNT: 500,
    /** Maximum booking advance days */
    MAX_BOOKING_ADVANCE_DAYS: 60,
    /** Whether the platform currently processes payments */
    PAYMENTS_ENABLED: false,
    /** Payment notice message shown at checkout */
    PAYMENT_NOTICE: 'Online payment processing is coming soon. For now, please arrange payment directly with the vendor after placing your order.',
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
    NAME: 'MyHarvestHub',
    DESCRIPTION: 'Faith-Based E-Marketplace for Christian Communities',
    URL: 'https://myharvesthub.org',
    SUPPORT_EMAIL: 'support@myharvesthub.org',
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
export enum BugReportCategory {
    UI_ISSUE = 'UI_ISSUE',
    PAYMENT = 'PAYMENT',
    ORDER = 'ORDER',
    ACCOUNT = 'ACCOUNT',
    PERFORMANCE = 'PERFORMANCE',
    OTHER = 'OTHER',
}

export enum BugReportPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export enum BugReportStatus {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    CLOSED = 'CLOSED',
}

export const BUG_REPORT_CATEGORIES = [
    { value: BugReportCategory.UI_ISSUE, label: 'UI / Display Issue' },
    { value: BugReportCategory.PAYMENT, label: 'Payment Problem' },
    { value: BugReportCategory.ORDER, label: 'Order Issue' },
    { value: BugReportCategory.ACCOUNT, label: 'Account Problem' },
    { value: BugReportCategory.PERFORMANCE, label: 'Performance / Speed' },
    { value: BugReportCategory.OTHER, label: 'Other' },
];

export const BUG_REPORT_PRIORITIES = [
    { value: BugReportPriority.LOW, label: 'Low' },
    { value: BugReportPriority.MEDIUM, label: 'Medium' },
    { value: BugReportPriority.HIGH, label: 'High' },
    { value: BugReportPriority.CRITICAL, label: 'Critical' },
];

export const BUG_REPORT_STATUSES = [
    { value: BugReportStatus.OPEN, label: 'Open' },
    { value: BugReportStatus.IN_PROGRESS, label: 'In Progress' },
    { value: BugReportStatus.RESOLVED, label: 'Resolved' },
    { value: BugReportStatus.CLOSED, label: 'Closed' },
];

// ============================================================================
// BANNER CONFIGURATION
// ============================================================================

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
            actionBg: 'bg-ds-brand-primary-hover',
            actionBgDark: '',
            actionText: 'text-white',
            accentBg: 'bg-ds-brand-primary-light',
            badge: 'bg-ds-brand-primary-light/20 text-ds-palette-purple-100',
            primaryBtn: 'bg-ds-surface-base text-ds-palette-purple-700 hover:bg-ds-brand-surface',
            secondaryBtn: 'border border-ds-surface-base/60 text-white hover:bg-ds-surface-base/10',
        },
        CHURCH: {
            actionBg: 'bg-ds-status-warning-text',
            actionBgDark: '',
            actionText: 'text-white',
            accentBg: 'bg-ds-status-warning',
            badge: 'bg-ds-status-warning/20 text-ds-palette-amber-100',
            primaryBtn: 'bg-ds-surface-base text-ds-status-warning-text hover:bg-ds-status-warning-bg',
            secondaryBtn: 'border border-ds-surface-base/60 text-white hover:bg-ds-surface-base/10',
        },
        EVENT: {
            actionBg: 'bg-rose-700',
            actionBgDark: 'dark:bg-rose-900',
            actionText: 'text-white',
            accentBg: 'bg-rose-500',
            badge: 'bg-rose-500/20 text-rose-100',
            primaryBtn: 'bg-ds-surface-base text-rose-700 hover:bg-rose-50',
            secondaryBtn: 'border border-ds-surface-base/60 text-white hover:bg-ds-surface-base/10',
        },
        PROMOTION: {
            actionBg: 'bg-ds-status-success-text',
            actionBgDark: 'dark:bg-ds-status-success-bg',
            actionText: 'text-white',
            accentBg: 'bg-ds-status-success',
            badge: 'bg-ds-status-success/20 text-ds-palette-green-100',
            primaryBtn: 'bg-ds-surface-base text-ds-status-success-text hover:bg-ds-status-success-bg',
            secondaryBtn: 'border border-ds-surface-base/60 text-white hover:bg-ds-surface-base/10',
        },
    },
} as const;
