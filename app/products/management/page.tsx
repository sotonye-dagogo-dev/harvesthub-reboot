"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProductsManagementPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    redirect("/login");
  }

  // Only vendors can access product management
  if (user.role !== "VENDOR") {
    redirect("/products");
  }

  // Redirect to vendor products page (would be created as separate feature)
  redirect("/products");
}
