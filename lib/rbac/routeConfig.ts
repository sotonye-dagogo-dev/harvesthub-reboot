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
    { path: '/vendors', labelKey: 'vendors', featureKey: 'vendors', public: true },
    { path: '/orders', labelKey: 'orders', featureKey: 'orders', public: false, roles: [UserRole.BUYER, UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/wallet', labelKey: 'wallet', featureKey: 'wallet', public: false, roles: [UserRole.BUYER, UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/notifications', labelKey: 'notifications', featureKey: 'notifications', public: false, roles: [UserRole.BUYER, UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/dashboard', labelKey: 'dashboard', featureKey: 'dashboard', public: false, roles: [UserRole.BUYER, UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/analytics', labelKey: 'analytics', featureKey: 'analytics', public: false, roles: [UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/admin/dashboard', labelKey: 'dashboard', featureKey: 'admin-dashboard', public: false, roles: [UserRole.ADMIN] },
    { path: '/admin/public-content', labelKey: 'adminPublicContent', featureKey: 'public-content', public: false, roles: [UserRole.ADMIN] },
    { path: '/vendor/dashboard', labelKey: 'dashboard', featureKey: 'vendor-dashboard', public: false, roles: [UserRole.VENDOR] },
    { path: '/vendor/products', labelKey: 'products', featureKey: 'vendor-products', public: false, roles: [UserRole.VENDOR] },
    { path: '/profile', labelKey: 'profile', featureKey: 'profile', public: false, roles: [UserRole.BUYER, UserRole.VENDOR, UserRole.ADMIN] },
    { path: '/store-settings', labelKey: 'storeSettings', featureKey: 'store-settings', public: false, roles: [UserRole.VENDOR] },
    { path: '/login', labelKey: 'login', featureKey: 'auth', public: true },
    { path: '/signup', labelKey: 'signup', featureKey: 'auth', public: true },
    { path: '/register', labelKey: 'signup', featureKey: 'auth', public: true },
    { path: '/about', labelKey: 'about', featureKey: 'about', public: true },
    { path: '/faqs', labelKey: 'faqs', featureKey: 'faqs', public: true },
    { path: '/terms', labelKey: 'terms', featureKey: 'terms', public: true },
    { path: '/privacy', labelKey: 'privacy', featureKey: 'privacy', public: true }
];

export function getRouteConfig(pathname: string): RouteConfig | null {
    const sorted = [...routeConfig].sort((a, b) => b.path.length - a.path.length);
    return sorted.find((config) => pathname === config.path || pathname.startsWith(`${config.path}/`)) ?? null;
}
