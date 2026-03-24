import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@/lib/constants";
import { getRoutePolicy } from "@/lib/rbac/policies";
import { verifyAccessToken } from "@/lib/utils/jwt";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const routePolicy = getRoutePolicy(pathname);

    // Get token from cookie
    const accessToken = request.cookies.get("accessToken")?.value;

    // Check if user is authenticated
    let user = null;
    if (accessToken) {
        try {
            user = await verifyAccessToken(accessToken);
        } catch {
            // Token is invalid or expired
            // Continue without user (will redirect if needed)
        }
    }

    // Allow public routes for everyone
    if (routePolicy?.public) {
        // If authenticated user tries to access auth routes (login/register only), redirect to dashboard
        if (user && routePolicy.authRoute) {
            return NextResponse.redirect(new URL(getDashboardRoute(user.role), request.url));
        }
        return NextResponse.next();
    }

    // Protect routes that require authentication
    if (!user) {
        // Redirect to login if not authenticated
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Check role-based access
    if (routePolicy?.roles?.length) {
        if (!routePolicy.roles.includes(user.role as UserRole)) {
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
    }

    return NextResponse.next();
}

// Helper to determine dashboard route by role
function getDashboardRoute(role: string): string {
    switch (role) {
        case UserRole.ADMIN:
            return "/admin/dashboard";
        case UserRole.VENDOR:
            return "/vendor/dashboard";
        case UserRole.BUYER:
            return "/";
        default:
            return "/";
    }
}

// Configure which routes to run middleware on
export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - api routes (handled separately)
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, manifest.json, robots.txt, etc.
         * - public assets (files with extensions)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|manifest\\.json|robots\\.txt|offline\\.html|.*\\..*|_next).*)",
    ],
};
