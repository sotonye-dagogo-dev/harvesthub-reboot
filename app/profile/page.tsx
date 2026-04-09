"use client";

import ProfilePage from "@/components/features/ProfilePage";
import { ClientDashboardShell } from "@/components/layout";
import { useAuth } from "@/lib/hooks/useAuth";

export default function ProfileRootPage() {
  const { user } = useAuth();
  const profileContent = <ProfilePage />;

  if (user?.role === "ADMIN" || user?.role === "VENDOR") {
    return (
      <ClientDashboardShell sidebarType={user.role === "ADMIN" ? "admin" : "vendor"}>
        {profileContent}
      </ClientDashboardShell>
    );
  }

  return profileContent;
}
