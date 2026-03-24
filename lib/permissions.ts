import { UserRole } from '@/lib/constants';

export type Capability =
    | 'viewOrders'
    | 'manageOrders'
    | 'viewProducts'
    | 'manageProducts'
    | 'viewVendors'
    | 'manageVendors'
    | 'viewDashboard'
    | 'viewAnalytics'
    | 'viewWallet'
    | 'manageContent'
    | 'viewNotifications';

const roleCapabilities: Record<UserRole, Capability[]> = {
    [UserRole.ADMIN]: [
        'viewOrders',
        'manageOrders',
        'viewProducts',
        'manageProducts',
        'viewVendors',
        'manageVendors',
        'viewDashboard',
        'viewAnalytics',
        'viewWallet',
        'manageContent',
        'viewNotifications',
    ],
    [UserRole.VENDOR]: [
        'viewOrders',
        'viewProducts',
        'manageProducts',
        'viewDashboard',
        'viewAnalytics',
        'viewWallet',
        'viewNotifications',
    ],
    [UserRole.BUYER]: [
        'viewOrders',
        'viewProducts',
        'viewWallet',
        'viewNotifications',
    ],
};

export function getRoleCapabilities(role: UserRole): Capability[] {
    return roleCapabilities[role] ?? [];
}

export function canAccess(role: UserRole | undefined, capability: Capability): boolean {
    if (!role) return false;
    const caps = getRoleCapabilities(role);
    return caps.includes(capability);
}
