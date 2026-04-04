/**
 * @file /dashboard/page.tsx
 * @purpose Role-based dashboard router (client-side redirect hub)
 *
 * WHY THIS EXISTS:
 * The middleware handles authentication at the edge, but role-based dashboard
 * redirection requires reading the user's role from the auth context, which
 * is only available client-side via useAuth(). Moving this logic to middleware
 * would require the middleware to decode the JWT and check the role on every
 * request to /dashboard — that pattern is supported but adds edge-runtime
 * complexity.
 *
 * PATTERN:
 * Any link that needs to "go to the right dashboard" can point to /dashboard
 * and let this page handle the redirect. This keeps routing logic centralized
 * and avoids hard-coding role-specific paths in nav components.
 *
 * ROUTES:
 *   - BUYER  -> / (no separate buyer dashboard)
 *   - VENDOR -> /analytics
 *   - ADMIN  -> /analytics
 *   - (unauthed) -> /login
 */
"use client";

import { PageLoader } from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    redirect("/login");
  }

  // Buyers don't have a dashboard, redirect to home
  if (user.role === "BUYER") {
    redirect("/");
  }

  // Redirect vendors and admins to unified analytics route
  if (user.role === "VENDOR" || user.role === "ADMIN") {
    redirect("/analytics");
  }

  // Fallback
  redirect("/");
}
