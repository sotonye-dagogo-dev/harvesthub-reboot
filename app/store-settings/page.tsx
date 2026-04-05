"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import StoreSettingsFeature from "@/components/features/StoreSettingsPage";
import { PageLoader } from "@/components/ui";
import { Sidebar } from "@/components/layout";

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
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar type={sidebarType} />
        <main className="flex-1 overflow-y-auto bg-ds-surface-sunken p-6 pb-20 dark:bg-ds-surface-sunken md:pb-6">
          <StoreSettingsFeature />
        </main>
      </div>
    </div>
  );
}
