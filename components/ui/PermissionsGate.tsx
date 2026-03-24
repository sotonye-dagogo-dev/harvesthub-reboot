import { ReactNode } from "react";
import { UserRole } from "@/lib/constants";
import { canAccess, Capability } from "@/lib/permissions";

type PermissionsGateProps = {
  role?: UserRole | null;
  capability: Capability;
  fallback?: ReactNode;
  children: ReactNode;
};

export function PermissionsGate({
  role,
  capability,
  fallback = null,
  children,
}: PermissionsGateProps) {
  if (!role || !canAccess(role, capability)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
