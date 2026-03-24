"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import StoreSettingsFeature from "@/components/features/StoreSettingsPage";
import { PageLoader } from "@/components/ui";

export default function StoreSettingsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-center text-ds-text-secondary">Please log in to access store settings</p>
      </div>
    );
  }

  return <StoreSettingsFeature />;
}
