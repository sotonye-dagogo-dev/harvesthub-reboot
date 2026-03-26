import { Capability } from '@/lib/permissions';

export const orderModule = {
    featureKey: 'orders',
    route: '/orders',
    labelKey: 'orders',
    capability: 'viewOrders' as Capability,
};

export type OrderModule = typeof orderModule;
