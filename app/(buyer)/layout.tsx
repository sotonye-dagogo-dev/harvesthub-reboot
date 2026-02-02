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
      <main className="flex-1 bg-gray-50 dark:bg-gray-950">{children}</main>
      <Footer />
    </div>
  );
}
