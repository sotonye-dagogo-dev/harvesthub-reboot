"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { RoleGuard } from "@/components/ui/RoleGuard";
import { Capability } from "@/lib/permissions";

type RoleAwareFeatureRendererProps = {
  requiredCapability: Capability;
  children: ReactNode;
};

export function RoleAwareFeatureRenderer({
  requiredCapability,
  children,
}: RoleAwareFeatureRendererProps) {
  const { user } = useAuth();

  return (
    <RoleGuard role={user?.role} capability={requiredCapability}>
      {children}
    </RoleGuard>
  );
}
