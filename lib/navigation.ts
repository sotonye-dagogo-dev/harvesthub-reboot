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
    wallet: 'Wallet',
    notifications: 'Notifications',
    dashboard: 'Dashboard',
    profile: 'Profile',
    login: 'Login',
    signup: 'Sign Up',
    about: 'About',
    faqs: 'FAQs',
    terms: 'Terms',
    privacy: 'Privacy',
    adminPublicContent: 'Public Content',
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
