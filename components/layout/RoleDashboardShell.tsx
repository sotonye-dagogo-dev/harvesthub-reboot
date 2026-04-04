import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { UserRole } from "@/lib/constants";
import { requireAnyRole } from "@/lib/utils/auth";
import { Header, Sidebar } from "@/components/layout";

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

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar type={sidebarType} />
        <main className="flex-1 overflow-y-auto bg-ds-surface-sunken p-6 pb-20 dark:bg-ds-surface-sunken md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
