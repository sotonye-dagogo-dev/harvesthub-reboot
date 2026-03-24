import { getRouteConfig, RouteConfig } from '@/lib/rbac/routeConfig';

export type RoutePolicy = RouteConfig & {
  authRoute?: boolean;
};

export function getRoutePolicy(pathname: string): RoutePolicy | null {
  const route = getRouteConfig(pathname);
  if (!route) return null;

  const policy: RoutePolicy = {
    ...route,
    authRoute: route.path === '/login' || route.path === '/signup' || route.path === '/register',
  };

  return policy;
}
