"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function OrdersManagementPage() {
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

  // Vendors redirect to vendor-specific orders
  if (user.role === "VENDOR") {
    redirect("/orders"); // Would show vendor view
  }

  // Admins redirect to admin order management
  if (user.role === "ADMIN") {
    redirect("/admin/orders");
  }

  // Buyers see their order history
  redirect("/orders");
}
