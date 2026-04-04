import { getRouteConfig, RouteConfig } from '@/lib/rbac/routeConfig';

export type RoutePolicy = RouteConfig & {
  authRoute?: boolean;
};

export function getRoutePolicy(pathname: string): RoutePolicy | null {
  const route = getRouteConfig(pathname);
  if (!route) return null;

  const isAuthRoute =
    route.path === '/login' ||
    route.path === '/signup' ||
    route.path.startsWith('/signup/');

  const policy: RoutePolicy = {
    ...route,
    authRoute: isAuthRoute,
  };

  return policy;
}
