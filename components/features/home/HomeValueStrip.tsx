import Link from "next/link";
import { BadgeCheck, MapPin, ShieldCheck, Store, Ticket, Wallet } from "lucide-react";

const VALUE_ITEMS = [
  { href: "/help", icon: MapPin, title: "Campus pickup", subtitle: "Collect after service" },
  { href: "/help", icon: ShieldCheck, title: "Secure payments", subtitle: "Paystack & wallet" },
  { href: "/vendors", icon: BadgeCheck, title: "Verified vendors", subtitle: "Harvesters community" },
  { href: "/wallet", icon: Wallet, title: "MyHarvestHub wallet", subtitle: "Pay in one tap" },
  { href: "/vouchers", icon: Ticket, title: "Vouchers & rewards", subtitle: "Save on every order" },
  { href: "/become-vendor", icon: Store, title: "Sell with us", subtitle: "Open your store" },
];

/** Row of quick value tiles under the hero (Jumia's "quick links" strip). */
export function HomeValueStrip() {
  return (
    <div className="mb-4 grid grid-cols-3 gap-2 rounded-ds-md bg-ds-surface-base p-2 shadow-ds-sm dark:bg-ds-surface-raised sm:grid-cols-6">
      {VALUE_ITEMS.map(({ href, icon: Icon, title, subtitle }) => (
        <Link
          key={title}
          href={href}
          className="flex flex-col items-center gap-1 rounded-ds-sm px-1 py-2 text-center transition-colors hover:bg-ds-brand-surface sm:flex-row sm:text-left"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-ds-full bg-ds-brand-subtle text-ds-text-brand">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-semibold text-ds-text-primary sm:text-xs">{title}</span>
            <span className="hidden truncate text-[11px] text-ds-text-secondary lg:block">{subtitle}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
