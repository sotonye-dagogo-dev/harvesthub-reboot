import { UserRole } from '@/lib/constants';

export function getDashboardRoute(role: string | null | undefined): string {
    switch (role) {
        case UserRole.ADMIN:
            return '/admin/dashboard';
        case UserRole.VENDOR:
            return '/vendor/dashboard';
        case UserRole.BUYER:
            return '/dashboard';
        default:
            return '/dashboard';
    }
}
