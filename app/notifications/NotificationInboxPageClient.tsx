"use client";

import { NotificationInbox } from "@/components/features/NotificationInbox";
import { ClientDashboardShell } from "@/components/layout";
import { useAuth } from "@/lib/hooks/useAuth";

export function NotificationInboxPageClient() {
  const { user } = useAuth();

  const content = <NotificationInbox />;

  if (user?.role === "ADMIN" || user?.role === "VENDOR") {
    return (
      <ClientDashboardShell sidebarType={user.role === "ADMIN" ? "admin" : "vendor"}>
        {content}
      </ClientDashboardShell>
    );
  }

  return content;
}
