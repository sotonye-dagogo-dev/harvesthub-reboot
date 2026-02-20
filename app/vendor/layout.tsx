import { ReactNode } from "react";
import { Header, Sidebar } from "@/components/layout";

export const dynamic = "force-dynamic";

interface VendorLayoutProps {
  children: ReactNode;
}

export default function VendorLayout({ children }: VendorLayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar type="vendor" />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 pb-20 dark:bg-gray-950 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
