import { ReactNode } from "react";
import { UserRole } from "@/lib/constants";
import { canAccess, Capability } from "@/lib/permissions";
import { EmptyState } from "@/components/ui";

type RoleGuardProps = {
  role?: UserRole | null;
  capability: Capability;
  children: ReactNode;
};

export function RoleGuard({ role, capability, children }: RoleGuardProps) {
  if (!role || !canAccess(role, capability)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="Access Denied"
          description="You do not have permission to access this content."
        />
      </div>
    );
  }

  return <>{children}</>;
}
