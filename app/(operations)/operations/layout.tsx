import { ReactNode } from "react";
import RoleDashboardShell from "@/components/layout/RoleDashboardShell";

export const dynamic = "force-dynamic";

interface OperationsLayoutProps {
  children: ReactNode;
}

export default async function OperationsLayout({ children }: OperationsLayoutProps) {
  return <RoleDashboardShell section="operations">{children}</RoleDashboardShell>;
}
