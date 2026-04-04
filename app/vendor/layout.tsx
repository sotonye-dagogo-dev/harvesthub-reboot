import { ReactNode } from "react";
import RoleDashboardShell from "@/components/layout/RoleDashboardShell";

export const dynamic = "force-dynamic";

interface VendorLayoutProps {
  children: ReactNode;
}

export default async function VendorLayout({ children }: VendorLayoutProps) {
  return <RoleDashboardShell section="vendor">{children}</RoleDashboardShell>;
}
