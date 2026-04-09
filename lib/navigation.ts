import { UserRole } from '@/lib/constants';
import { routeConfig } from '@/lib/rbac/routeConfig';

export type NavItem = {
    path: string;
    label: string;
    icon?: string;
    isVisible: boolean;
};

const labelMap: Record<string, string> = {
    home: 'Home',
    products: 'Products',
    vendors: 'Vendors',
    orders: 'Orders',
    operationsOrders: 'Orders',
    wallet: 'Wallet',
    notifications: 'Notifications',
    notificationSettings: 'Notification Settings',
    dashboard: 'Dashboard',
    profile: 'Profile',
    becomeVendor: 'Register Store',
    login: 'Login',
    signup: 'Sign Up',
    about: 'About',
    faqs: 'FAQs',
    terms: 'Terms',
    privacy: 'Privacy',
    help: 'Help',
    contact: 'Contact',
    advertise: 'Advertise',
    forgotPassword: 'Forgot Password',
    checkout: 'Checkout',
    analytics: 'Analytics',
    storeSettings: 'Store Settings',
    adminPublicContent: 'Public Content',
    adminVendors: 'Vendors',
    adminUsers: 'Users',
    adminBanners: 'Banners',
    adminAds: 'Ads',
    adminBugReports: 'Bug Reports',
    adminSettings: 'Settings',
    adminVendorContent: 'Marketing Review',
    vendorMarketingContent: 'Marketing Content',
};

export function buildNav(role?: UserRole) {
    return routeConfig
        .filter((item) => item.path !== '/login' && item.path !== '/signup')
        .filter((item) => {
            if (item.public) return true;
            if (!item.roles || item.roles.length === 0) {
                return !!role;
            }
            return !!role && item.roles.includes(role);
        })
        .map((item) => ({
            path: item.path,
            label: labelMap[item.labelKey] ?? item.labelKey,
            icon: item.icon,
            isVisible: true,
        }));
}
