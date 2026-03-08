import { ReactNode } from "react";
import { Header, Footer } from "@/components/layout";

export const dynamic = "force-dynamic";

interface BuyerLayoutProps {
  children: ReactNode;
}

export default function BuyerLayout({ children }: BuyerLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-ds-surface-sunken dark:bg-ds-surface-sunken">{children}</main>
      <Footer />
    </div>
  );
}
