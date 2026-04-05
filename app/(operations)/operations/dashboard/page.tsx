import { UserRole } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";
import { requireAnyRole } from "@/lib/utils/auth";
import { Activity, ArrowRight, BarChart3, Megaphone, Package, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

type MetricCard = {
  title: string;
  value: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
  cta: string;
};

type QuickAction = {
  title: string;
  description: string;
  href: string;
};

async function getAdminMetrics() {
  const [activeVendors, pendingAds, totalOrders, totalUsers] = await Promise.all([
    prisma.vendor.count({ where: { status: "APPROVED" } }),
    prisma.adApplication.count({ where: { status: { in: ["PENDING", "PENDING_PAYMENT", "PENDING_APPROVAL"] } } }),
    prisma.order.count(),
    prisma.user.count(),
  ]);

  const cards: MetricCard[] = [
    {
      title: "Active Vendors",
      value: activeVendors.toLocaleString(),
      description: "Approved vendors currently selling.",
      icon: Users,
      href: "/operations/vendors",
      cta: "Manage vendors",
    },
    {
      title: "Pending Ads",
      value: pendingAds.toLocaleString(),
      description: "Applications waiting for review or payment confirmation.",
      icon: Megaphone,
      href: "/operations/ads",
      cta: "Review ads",
    },
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      description: "All-time order volume across the marketplace.",
      icon: ShoppingBag,
      href: "/operations/orders",
      cta: "View orders",
    },
    {
      title: "Registered Users",
      value: totalUsers.toLocaleString(),
      description: "Total user accounts on the platform.",
      icon: Activity,
      href: "/operations/users",
      cta: "Open user management",
    },
  ];

  const quickActions: QuickAction[] = [
    {
      title: "Moderate Vendors",
      description: "Approve, reject, or suspend vendor accounts.",
      href: "/operations/vendors",
    },
    {
      title: "Publish Public Content",
      description: "Edit banners, policy pages, and help content.",
      href: "/operations/public-content",
    },
    {
      title: "Review Bug Reports",
      description: "Triage incoming reports and update resolution status.",
      href: "/operations/bug-reports",
    },
  ];

  return { cards, quickActions };
}

async function getVendorMetrics(userId: string) {
  const vendor = await prisma.vendor.findUnique({ where: { userId }, select: { id: true } });
  if (!vendor) {
    return {
      cards: [] as MetricCard[],
      quickActions: [] as QuickAction[],
      emptyState: "Your vendor profile is not fully initialized yet. Complete onboarding to unlock dashboard metrics.",
    };
  }

  const [totalProducts, activeProducts, totalOrders, revenueAgg, pendingOrders] = await Promise.all([
    prisma.product.count({ where: { vendorId: vendor.id } }),
    prisma.product.count({ where: { vendorId: vendor.id, isActive: true } }),
    prisma.order.count({ where: { vendorId: vendor.id } }),
    prisma.order.aggregate({ where: { vendorId: vendor.id, paymentStatus: "PAID" }, _sum: { total: true } }),
    prisma.order.count({ where: { vendorId: vendor.id, status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
  ]);

  const cards: MetricCard[] = [
    {
      title: "Catalog Size",
      value: totalProducts.toLocaleString(),
      description: `${activeProducts.toLocaleString()} currently active listings.`,
      icon: Package,
      href: "/operations/products",
      cta: "Manage products",
    },
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      description: `${pendingOrders.toLocaleString()} orders need attention.`,
      icon: ShoppingBag,
      href: "/operations/orders",
      cta: "Track orders",
    },
    {
      title: "Paid Revenue",
      value: `N${(revenueAgg._sum.total ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      description: "Settled order value from paid purchases.",
      icon: BarChart3,
      href: "/analytics",
      cta: "Open analytics",
    },
  ];

  const quickActions: QuickAction[] = [
    {
      title: "Add New Product",
      description: "Create a new listing with images, pricing, and stock.",
      href: "/operations/products",
    },
    {
      title: "Update Store Settings",
      description: "Edit business profile, delivery, and pickup preferences.",
      href: "/store-settings",
    },
    {
      title: "Review Campaign Performance",
      description: "Track your ad applications and reach.",
      href: "/operations/ads",
    },
  ];

  return { cards, quickActions, emptyState: null as string | null };
}

export default async function OperationsDashboardPage() {
  const user = await requireAnyRole([UserRole.ADMIN, UserRole.VENDOR]);
  let loadError: string | null = null;
  const metrics = await (async () => {
    try {
      return user.role === UserRole.ADMIN ? await getAdminMetrics() : await getVendorMetrics(user.userId);
    } catch {
      loadError = "Unable to load dashboard metrics right now. Please refresh and try again.";
      return {
        cards: [] as MetricCard[],
        quickActions: [] as QuickAction[],
        emptyState: null as string | null,
      };
    }
  })();
  const emptyState = "emptyState" in metrics && typeof metrics.emptyState === "string" ? metrics.emptyState : null;

  const heading = user.role === UserRole.ADMIN ? "Admin Dashboard" : "Vendor Dashboard";
  const intro =
    user.role === UserRole.ADMIN
      ? "Manage users, vendors, content and brand campaigns from here."
      : "View your sales, orders, products, and ad campaign performance.";

  return (
    <div className="container mx-auto px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-ds-text-primary sm:text-3xl">{heading}</h1>
      <p className="mt-2 max-w-3xl text-ds-text-secondary">{intro}</p>

      <p className="mt-1 text-xs text-ds-text-tertiary">Last updated: {new Date().toLocaleString()}</p>

      {loadError ? (
        <div className="mt-4 rounded-ds-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      {emptyState ? (
        <div className="mt-6 rounded-ds-lg border border-ds-border-base bg-ds-surface-raised p-5 text-sm text-ds-text-secondary">
          {emptyState}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.cards.map((card) => (
          <article
            key={card.title}
            className="rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-5 shadow-ds-sm"
          >
            <div className="mb-3 inline-flex rounded-ds-md bg-ds-brand-surface p-2 text-ds-text-brand">
              <card.icon className="h-5 w-5" aria-hidden="true" />
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
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ds-text-primary">Quick Actions</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {metrics.quickActions.map((action) => (
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
