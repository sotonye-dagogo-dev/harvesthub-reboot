import { UserRole } from "@/lib/constants";
import { requireAnyRole } from "@/lib/utils/auth";
import { Activity, BarChart3, Megaphone, Package, ShoppingBag, Users } from "lucide-react";

export default async function OperationsDashboardPage() {
  const user = await requireAnyRole([UserRole.ADMIN, UserRole.VENDOR]);

  const cards =
    user.role === UserRole.ADMIN
      ? [
          {
            title: "Active Vendors",
            description: "Quick stats and management shortcuts.",
            icon: Users,
          },
          {
            title: "Pending Ads",
            description: "Review and approve ad applications collected from market places.",
            icon: Megaphone,
          },
          {
            title: "Site Health",
            description: "Track system status and performance metrics.",
            icon: Activity,
          },
        ]
      : [
          {
            title: "My Orders",
            description: "Monitor pending orders and delivery status.",
            icon: ShoppingBag,
          },
          {
            title: "Product Catalog",
            description: "Publish new products and optimize listings.",
            icon: Package,
          },
          {
            title: "Ad Campaigns",
            description: "Track your ads and activity analytics.",
            icon: BarChart3,
          },
        ];

  const heading = user.role === UserRole.ADMIN ? "Admin Dashboard" : "Vendor Dashboard";
  const intro =
    user.role === UserRole.ADMIN
      ? "Manage users, vendors, content and brand campaigns from here."
      : "View your sales, orders, products, and ad campaign performance.";

  return (
    <div className="container mx-auto px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-ds-text-primary sm:text-3xl">{heading}</h1>
      <p className="mt-2 max-w-3xl text-ds-text-secondary">{intro}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-5 shadow-ds-sm"
          >
            <div className="mb-3 inline-flex rounded-ds-md bg-ds-brand-surface p-2 text-ds-text-brand">
              <card.icon className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-ds-text-primary sm:text-xl">{card.title}</h2>
            <p className="mt-1 text-sm text-ds-text-secondary">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
