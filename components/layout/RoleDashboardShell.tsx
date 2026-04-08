import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { UserRole } from "@/lib/constants";
import { requireAnyRole } from "@/lib/utils/auth";
import { ClientDashboardShell } from "./ClientDashboardShell";

type DashboardSection = "admin" | "vendor" | "operations";

const ACCESS_MAP: Record<DashboardSection, UserRole[]> = {
  admin: [UserRole.ADMIN],
  vendor: [UserRole.VENDOR, UserRole.ADMIN],
  operations: [UserRole.VENDOR, UserRole.ADMIN],
};

interface RoleDashboardShellProps {
  section: DashboardSection;
  children: ReactNode;
}

export default async function RoleDashboardShell({ section, children }: RoleDashboardShellProps) {
  let sessionUser: Awaited<ReturnType<typeof requireAnyRole>> | null = null;

  try {
    sessionUser = await requireAnyRole(ACCESS_MAP[section]);
  } catch {
    redirect("/unauthorized");
  }

  const sidebarType =
    section === "operations"
      ? sessionUser?.role === UserRole.ADMIN
        ? "admin"
        : "vendor"
      : section;

  return <ClientDashboardShell sidebarType={sidebarType}>{children}</ClientDashboardShell>;
}
