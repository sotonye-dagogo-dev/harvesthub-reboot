import { UserRole } from '@/lib/constants';

export function getDashboardRoute(role: string | null | undefined): string {
    switch (role) {
        case UserRole.ADMIN:
            return '/operations/dashboard';
        case UserRole.VENDOR:
            return '/operations/dashboard';
        case UserRole.BUYER:
            return '/dashboard';
        default:
            return '/dashboard';
    }
}
