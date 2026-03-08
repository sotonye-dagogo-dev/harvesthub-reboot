import { ReactNode } from "react";
import { Header, Footer } from "@/components/layout";
import { TopAdBanner } from "@/components/features";

export const dynamic = "force-dynamic";

interface BuyerLayoutProps {
  children: ReactNode;
}

export default function BuyerLayout({ children }: BuyerLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <TopAdBanner />
      <main className="flex-1 bg-ds-surface-sunken dark:bg-ds-surface-sunken">{children}</main>
      <Footer />
    </div>
  );
}
