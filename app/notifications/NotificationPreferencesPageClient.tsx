"use client";

import { NotificationPreferences } from "@/components/features/NotificationPreferences";
import { ClientDashboardShell } from "@/components/layout";
import { useAuth } from "@/lib/hooks/useAuth";

export function NotificationPreferencesPageClient() {
  const { user } = useAuth();

  const content = (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ds-text-primary">Notification Preferences</h1>
        <p className="mt-1 text-ds-text-secondary">
          Choose how you want to be notified about important updates
        </p>
      </div>

      <NotificationPreferences />
    </div>
  );

  if (user?.role === "ADMIN" || user?.role === "VENDOR") {
    return (
      <ClientDashboardShell sidebarType={user.role === "ADMIN" ? "admin" : "vendor"}>
        {content}
      </ClientDashboardShell>
    );
  }

  return content;
}
