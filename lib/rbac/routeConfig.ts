import { UserRole } from '@/lib/constants';

export type RouteConfig = {
    path: string;
    labelKey: string;
    featureKey: string;
    public: boolean;
    roles?: UserRole[];
    icon?: string;
    simple?: boolean;
};

export const routeConfig: RouteConfig[] = [
    { path: '/', labelKey: 'home', featureKey: 'home', public: true, simple: true },
    { path: '/products', labelKey: 'products', featureKey: 'products', public: true },
    { path: '/cart', labelKey: 'cart', featureKey: 'cart', public: true },
    { path: '/favourites', labelKey: 'favourites', featureKey: 'favourites', public: true },
    { path: '/vendors', labelKey: 'vendors', featureKey: 'vendors', public: true },
    { path: '/bug-report', labelKey: 'bugReport', featureKey: 'bug-report', public: true },
    { path: '/cookies', labelKey: 'cookies', featureKey: 'cookies', public: true },
    { path: '/orders', labelKey: 'orders', featureKey: 'orders', public: false, roles: [UserRole.BUYER, UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/wallet', labelKey: 'wallet', featureKey: 'wallet', public: false, roles: [UserRole.BUYER, UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/notifications', labelKey: 'notifications', featureKey: 'notifications', public: false, roles: [UserRole.BUYER, UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/notifications/settings', labelKey: 'notificationSettings', featureKey: 'notifications-settings', public: false, roles: [UserRole.BUYER, UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/dashboard', labelKey: 'dashboard', featureKey: 'dashboard', public: false, roles: [UserRole.BUYER, UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/analytics', labelKey: 'analytics', featureKey: 'analytics', public: false, roles: [UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/operations/dashboard', labelKey: 'dashboard', featureKey: 'operations-dashboard', public: false, roles: [UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/operations/orders', labelKey: 'operationsOrders', featureKey: 'operations-orders', public: false, roles: [UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/operations/products', labelKey: 'products', featureKey: 'operations-products', public: false, roles: [UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/operations/public-content', labelKey: 'adminPublicContent', featureKey: 'operations-public-content', public: false, roles: [UserRole.ADMIN] },
    { path: '/operations/vendors', labelKey: 'adminVendors', featureKey: 'operations-vendors', public: false, roles: [UserRole.ADMIN] },
    { path: '/operations/users', labelKey: 'adminUsers', featureKey: 'operations-users', public: false, roles: [UserRole.ADMIN] },
    { path: '/operations/banners', labelKey: 'adminBanners', featureKey: 'operations-banners', public: false, roles: [UserRole.ADMIN] },
    { path: '/operations/ads', labelKey: 'adminAds', featureKey: 'operations-ads', public: false, roles: [UserRole.ADMIN] },
    { path: '/operations/bug-reports', labelKey: 'adminBugReports', featureKey: 'operations-bug-reports', public: false, roles: [UserRole.ADMIN] },
    { path: '/operations/settings', labelKey: 'adminSettings', featureKey: 'operations-settings', public: false, roles: [UserRole.ADMIN] },
    { path: '/operations/vendor-content', labelKey: 'adminVendorContent', featureKey: 'operations-vendor-content', public: false, roles: [UserRole.ADMIN] },
    { path: '/operations/marketing-content', labelKey: 'vendorMarketingContent', featureKey: 'operations-marketing-content', public: false, roles: [UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/operations/blog', labelKey: 'adminBlog', featureKey: 'operations-blog', public: false, roles: [UserRole.ADMIN] },
    { path: '/blog', labelKey: 'blog', featureKey: 'blog', public: true },
    { path: '/advertise', labelKey: 'advertise', featureKey: 'advertise', public: true },
    { path: '/advertise/apply', labelKey: 'advertiseApply', featureKey: 'advertise-apply', public: true },
    { path: '/ad-application', labelKey: 'advertise', featureKey: 'ad-application', public: true },
    { path: '/profile', labelKey: 'profile', featureKey: 'profile', public: false, roles: [UserRole.BUYER, UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/become-vendor', labelKey: 'becomeVendor', featureKey: 'become-vendor', public: false, roles: [UserRole.BUYER, UserRole.ADMIN] },
    { path: '/store-settings', labelKey: 'storeSettings', featureKey: 'store-settings', public: false, roles: [UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/login', labelKey: 'login', featureKey: 'auth', public: true },
    { path: '/signup', labelKey: 'signup', featureKey: 'auth', public: true },
    { path: '/signup/user-info', labelKey: 'signup', featureKey: 'auth-signup-user-info', public: true },
    { path: '/signup/store-info', labelKey: 'signup', featureKey: 'auth-signup-store-info', public: true },
    { path: '/signup/verification-docs', labelKey: 'signup', featureKey: 'auth-signup-verification-docs', public: true },
    { path: '/signup/account-info', labelKey: 'signup', featureKey: 'auth-signup-account-info', public: true },
    { path: '/signup/security-info', labelKey: 'signup', featureKey: 'auth-signup-security-info', public: true },
    { path: '/signup-success', labelKey: 'signupSuccess', featureKey: 'auth-signup-success', public: true },
    { path: '/forgot-password', labelKey: 'forgotPassword', featureKey: 'auth', public: true },
    { path: '/help', labelKey: 'help', featureKey: 'support', public: true },
    { path: '/contact', labelKey: 'contact', featureKey: 'support', public: true },
    { path: '/checkout', labelKey: 'checkout', featureKey: 'checkout', public: false, roles: [UserRole.BUYER, UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/about', labelKey: 'about', featureKey: 'about', public: true },
    { path: '/faqs', labelKey: 'faqs', featureKey: 'faqs', public: true },
    { path: '/terms', labelKey: 'terms', featureKey: 'terms', public: true },
    { path: '/privacy', labelKey: 'privacy', featureKey: 'privacy', public: true },
    { path: '/vouchers', labelKey: 'vouchers', featureKey: 'vouchers', public: false, roles: [UserRole.BUYER, UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/operations/vouchers', labelKey: 'adminVouchers', featureKey: 'operations-vouchers', public: false, roles: [UserRole.ADMIN] },
    { path: '/unauthorized', labelKey: 'unauthorized', featureKey: 'unauthorized', public: true },
];

export function getRouteConfig(pathname: string): RouteConfig | null {
    const sorted = [...routeConfig].sort((a, b) => b.path.length - a.path.length);
    return sorted.find((config) => pathname === config.path || pathname.startsWith(`${config.path}/`)) ?? null;
}
