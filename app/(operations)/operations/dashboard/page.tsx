"use client";

import { useCallback, type ComponentType } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Megaphone,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useSmartResource } from "@/lib/hooks/useSmartResource";
import { Button, SectionLoader } from "@/components/ui";

type DashboardIconName =
  | "users"
  | "megaphone"
  | "shopping-bag"
  | "activity"
  | "package"
  | "bar-chart";

type MetricCard = {
  title: string;
  value: string;
  description: string;
  icon: DashboardIconName;
  href: string;
  cta: string;
};

type QuickAction = {
  title: string;
  description: string;
  href: string;
};

type OperationsDashboardPayload = {
  role: "ADMIN" | "VENDOR";
  cards: MetricCard[];
  quickActions: QuickAction[];
  emptyState: string | null;
  updatedAt: string;
};

const ICONS: Record<DashboardIconName, ComponentType<{ className?: string }>> = {
  users: Users,
  megaphone: Megaphone,
  "shopping-bag": ShoppingBag,
  activity: Activity,
  package: Package,
  "bar-chart": BarChart3,
};

export default function OperationsDashboardPage() {
  const loadDashboard = useCallback(async (): Promise<OperationsDashboardPayload> => {
    const response = await fetch("/api/operations/dashboard");
    const data = (await response.json().catch(() => ({}))) as {
      data?: OperationsDashboardPayload;
      error?: string;
    };

    if (!response.ok || !data.data) {
      throw new Error(data.error || "Unable to load dashboard metrics right now.");
    }

    return data.data;
  }, []);

  const {
    data: dashboard,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useSmartResource(loadDashboard, {
    key: "operations-dashboard",
    staleTimeMs: 15_000,
    refreshIntervalMs: 60_000,
  });

  if (isLoading && !dashboard) {
    return <SectionLoader />;
  }

  const role = dashboard?.role ?? "VENDOR";
  const heading = role === "ADMIN" ? "Admin Dashboard" : "Vendor Dashboard";
  const intro =
    role === "ADMIN"
      ? "Manage users, vendors, content and brand campaigns from here."
      : "View your sales, orders, products, and ad campaign performance.";

  return (
    <div className="container mx-auto px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ds-text-primary sm:text-3xl">{heading}</h1>
          <p className="mt-2 max-w-3xl text-ds-text-secondary">{intro}</p>
          <p className="mt-1 text-xs text-ds-text-tertiary">
            Last updated:{" "}
            {dashboard?.updatedAt ? new Date(dashboard.updatedAt).toLocaleString() : "-"}
          </p>
          {isRefreshing ? (
            <p className="mt-1 text-xs text-ds-text-tertiary">Refreshing dashboard metrics...</p>
          ) : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh(true)}>
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-ds-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {dashboard?.emptyState ? (
        <div className="mt-6 rounded-ds-lg border border-ds-border-base bg-ds-surface-raised p-5 text-sm text-ds-text-secondary">
          {dashboard.emptyState}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(dashboard?.cards ?? []).map((card) => {
          const Icon = ICONS[card.icon] ?? Activity;
          return (
            <article
              key={card.title}
              className="rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-5 shadow-ds-sm"
            >
              <div className="mb-3 inline-flex rounded-ds-md bg-ds-brand-surface p-2 text-ds-text-brand">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-medium uppercase tracking-wide text-ds-text-secondary">
                {card.title}
              </h2>
              <p className="mt-1 text-3xl font-bold text-ds-text-primary">{card.value}</p>
              <p className="mt-2 text-sm text-ds-text-secondary">{card.description}</p>
              <Link
                href={card.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ds-text-brand hover:text-ds-brand-primary-hover"
              >
                {card.cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          );
        })}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ds-text-primary">Quick Actions</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {(dashboard?.quickActions ?? []).map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-4 transition-colors hover:bg-ds-brand-surface"
            >
              <p className="font-semibold text-ds-text-primary">{action.title}</p>
              <p className="mt-1 text-sm text-ds-text-secondary">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
