import { ReactNode } from "react";
import RoleDashboardShell from "@/components/layout/RoleDashboardShell";

// Admin pages require auth — must not be statically pre-rendered
export const dynamic = "force-dynamic";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  return <RoleDashboardShell section="admin">{children}</RoleDashboardShell>;
}
