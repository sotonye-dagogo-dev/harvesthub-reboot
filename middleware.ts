import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@/lib/constants";
import { getDashboardRoute } from "@/lib/utils/dashboard";
import { getRoutePolicy } from "@/lib/rbac/policies";
import { verifyAccessToken } from "@/lib/utils/jwt";

function getLegacyOperationsPath(pathname: string): string | null {
    if (pathname === "/admin" || pathname === "/admin/dashboard") {
        return "/operations/dashboard";
    }
    if (pathname === "/admin/users" || pathname.startsWith("/admin/users/")) {
        return pathname.replace("/admin/users", "/operations/users");
    }
    if (pathname === "/admin/vendors" || pathname.startsWith("/admin/vendors/")) {
        return pathname.replace("/admin/vendors", "/operations/vendors");
    }
    if (pathname === "/admin/banners") {
        return "/operations/banners";
    }
    if (pathname === "/admin/ads") {
        return "/operations/ads";
    }
    if (pathname === "/admin/public-content") {
        return "/operations/public-content";
    }
    if (pathname === "/admin/bug-reports") {
        return "/operations/bug-reports";
    }
    if (pathname === "/admin/settings") {
        return "/operations/settings";
    }
    if (pathname === "/admin/vendor-content") {
        return "/operations/vendor-content";
    }

    if (pathname === "/vendor" || pathname === "/vendor/dashboard") {
        return "/operations/dashboard";
    }
    if (pathname === "/vendor/marketing-content") {
        return "/operations/marketing-content";
    }
    if (pathname === "/vendor/store-settings") {
        return "/store-settings";
    }

    if (pathname.startsWith("/admin/")) {
        return "/operations/dashboard";
    }

    if (pathname.startsWith("/vendor/")) {
        return "/operations/dashboard";
    }

    return null;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const legacyPath = getLegacyOperationsPath(pathname);
    if (legacyPath && legacyPath !== pathname) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = legacyPath;
        return NextResponse.redirect(redirectUrl);
    }

    const routePolicy = getRoutePolicy(pathname);

    // If the route is not explicitly declared, treat as public to avoid accidental redirect loops (e.g., /unauthorized)
    if (!routePolicy) {
        return NextResponse.next();
    }

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

    // If email is not yet verified, route to verify page (except verification and auth routes)
    const verifyingAllowed = ["/verify-email", "/api/auth/verify-email", "/api/auth/resend-verification", "/signup", "/signup-success", "/login", "/api/auth/login", "/api/auth/register"];

    if (user && user.emailVerified === false && !verifyingAllowed.some((p) => pathname === p || pathname.startsWith(p))) {
        return NextResponse.redirect(new URL("/verify-email", request.url));
    }

    return NextResponse.next();
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
