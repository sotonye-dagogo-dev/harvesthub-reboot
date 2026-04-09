"use client";

import { AnalyticsFeature } from "@/components/features/AnalyticsFeature";
import { ClientDashboardShell } from "@/components/layout";
import { useAuth } from "@/lib/hooks/useAuth";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const analyticsContent = <AnalyticsFeature />;

  if (user?.role === "ADMIN" || user?.role === "VENDOR") {
    return (
      <ClientDashboardShell sidebarType={user.role === "ADMIN" ? "admin" : "vendor"}>
        {analyticsContent}
      </ClientDashboardShell>
    );
  }

  return analyticsContent;
}
