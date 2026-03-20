import { UserRole } from '@/lib/constants';

export type RoutePolicy = {
  pattern: string;
  public: boolean;
  roles?: UserRole[];
  authRoute?: boolean;
};

export const routePolicies: RoutePolicy[] = [
  { pattern: '/', public: true },
  { pattern: '/about', public: true },
  { pattern: '/contact', public: true },
  { pattern: '/bug-report', public: true },
  { pattern: '/cookies', public: true },
  { pattern: '/faqs', public: true },
  { pattern: '/help', public: true },
  { pattern: '/privacy', public: true },
  { pattern: '/terms', public: true },
  { pattern: '/products', public: true },
  { pattern: '/vendors', public: true },
  { pattern: '/signup', public: true },
  { pattern: '/signup/user-info', public: true },
  { pattern: '/signup/account-info', public: true },
  { pattern: '/signup/security-info', public: true },
  { pattern: '/signup/store-info', public: true },
  { pattern: '/signup-success', public: true },
  { pattern: '/forgot-password', public: true },
  { pattern: '/reset-password', public: true },
  { pattern: '/verify-email', public: true },
  { pattern: '/login', public: true, authRoute: true },
  { pattern: '/register', public: true, authRoute: true },
  { pattern: '/unauthorized', public: true },
  { pattern: '/admin', public: false, roles: [UserRole.ADMIN] },
  { pattern: '/vendor', public: false, roles: [UserRole.VENDOR] },
  { pattern: '/cart', public: false, roles: [UserRole.BUYER] },
  { pattern: '/checkout', public: false, roles: [UserRole.BUYER] },
  { pattern: '/orders', public: false },
  { pattern: '/wallet', public: false },
  { pattern: '/profile', public: false },
  { pattern: '/notifications', public: false },
  { pattern: '/favourites', public: false },
];

function isExactRootMatch(pathname: string, pattern: string): boolean {
  return pattern === '/' && pathname === '/';
}

function isPrefixMatch(pathname: string, pattern: string): boolean {
  return pattern !== '/' && (pathname === pattern || pathname.startsWith(`${pattern}/`));
}

export function getRoutePolicy(pathname: string): RoutePolicy | null {
  const sortedPolicies = [...routePolicies].sort((a, b) => b.pattern.length - a.pattern.length);
  return (
    sortedPolicies.find((policy) => {
      return isExactRootMatch(pathname, policy.pattern) || isPrefixMatch(pathname, policy.pattern);
    }) || null
  );
}
