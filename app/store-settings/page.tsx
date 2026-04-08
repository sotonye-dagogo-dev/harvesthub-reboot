"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import StoreSettingsFeature from "@/components/features/StoreSettingsPage";
import { PageLoader } from "@/components/ui";
import { ClientDashboardShell } from "@/components/layout";

export default function StoreSettingsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-center text-ds-text-secondary">Please log in to access store settings</p>
      </div>
    );
  }

  if (user.role !== "VENDOR" && user.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-center text-ds-text-secondary">Unauthorized</p>
      </div>
    );
  }

  const sidebarType = user.role === "ADMIN" ? "admin" : "vendor";

  return (
    <ClientDashboardShell sidebarType={sidebarType}>
      <StoreSettingsFeature />
    </ClientDashboardShell>
  );
}
