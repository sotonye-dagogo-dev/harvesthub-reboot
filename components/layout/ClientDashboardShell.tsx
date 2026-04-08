"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface ClientDashboardShellProps {
  sidebarType: "vendor" | "admin";
  children: ReactNode;
}

export function ClientDashboardShell({ sidebarType, children }: ClientDashboardShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar type={sidebarType} />
        <main className="flex-1 overflow-y-auto bg-ds-surface-sunken p-6 pb-20 dark:bg-ds-surface-sunken md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
