import { ReactNode } from "react";
import { Header, Footer } from "@/components/layout";
import { TopAdBanner } from "@/components/features";
import { requireRole } from "@/lib/utils/auth";
import { UserRole } from "@/lib/constants";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface BuyerLayoutProps {
  children: ReactNode;
}

export default async function BuyerLayout({ children }: BuyerLayoutProps) {
  try {
    await requireRole(UserRole.BUYER);
  } catch {
    // Redirect to login or unauthorized when not allowed
    redirect("/unauthorized");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <TopAdBanner />
      <main className="flex-1 bg-ds-surface-sunken dark:bg-ds-surface-sunken">{children}</main>
      <Footer />
    </div>
  );
}
