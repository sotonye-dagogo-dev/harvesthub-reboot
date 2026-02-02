"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    redirect("/login");
  }

  // Buyers don't have a dashboard, redirect to home
  if (user.role === "BUYER") {
    redirect("/");
  }

  // Redirect vendors to vendor analytics
  if (user.role === "VENDOR") {
    redirect("/vendor-analytics");
  }

  // Redirect admins to admin analytics
  if (user.role === "ADMIN") {
    redirect("/admin/analytics");
  }

  // Fallback
  redirect("/");
}
