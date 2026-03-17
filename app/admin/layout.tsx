import { ReactNode } from "react";
import { Header, Sidebar } from "@/components/layout";
import { requireRole } from "@/lib/utils/auth";
import { UserRole } from "@/lib/constants";
import { redirect } from "next/navigation";

// Admin pages require auth — must not be statically pre-rendered
export const dynamic = "force-dynamic";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  try {
    await requireRole(UserRole.ADMIN);
  } catch {
    redirect("/unauthorized");
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar type="admin" />
        <main className="flex-1 overflow-y-auto bg-ds-surface-sunken p-6 pb-20 dark:bg-ds-surface-sunken md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
