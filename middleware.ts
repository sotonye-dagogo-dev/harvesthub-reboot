import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/utils/jwt";

// Define route patterns for different access levels
const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/signup",
    "/signup/user-info",
    "/signup/account-info",
    "/signup/security-info",
    "/signup/store-info",
    "/signup-success",
    "/forgot-password",
    "/reset-password",
    "/products",
    "/vendors",
];
const authRoutes = ["/login", "/register"];
const buyerRoutes = ["/cart", "/checkout"];
// Routes accessible to all authenticated users (buyers, vendors, admins)
const sharedAuthRoutes = ["/orders", "/wallet", "/profile", "/notifications", "/favourites"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

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
    if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route))) {
        // If authenticated user tries to access auth routes (login/register only), redirect to dashboard
        if (user && authRoutes.some((route) => pathname === route)) {
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
    if (pathname.startsWith("/admin")) {
        if (user.role !== UserRole.ADMIN) {
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
    } else if (pathname.startsWith("/vendor")) {
        if (user.role !== UserRole.VENDOR) {
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
    } else if (buyerRoutes.some((route) => pathname.startsWith(route))) {
        if (user.role !== UserRole.BUYER) {
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
    }
    // Shared auth routes (/wallet, /orders, /profile, /notifications) are accessible
    // to all authenticated users — no role check needed (auth was verified above).

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

// Enum for UserRole (matches lib/types.ts)
enum UserRole {
    ADMIN = "ADMIN",
    VENDOR = "VENDOR",
    BUYER = "BUYER",
}

// Configure which routes to run middleware on
export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - api routes (handled separately)
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - public folder
         */
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
    ],
};
