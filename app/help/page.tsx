import { Metadata } from "next";
import Link from "next/link";
import { Search, Package, CreditCard, MapPin, Shield, HeadphonesIcon } from "lucide-react";
import { helpCenterConfig } from "@/lib/config/siteContent";

export const metadata: Metadata = {
  title: "Help Center | MyHarvestHub",
  description: "Find answers to common questions and get help with your MyHarvestHub experience.",
};

export default function HelpCenterPage() {
  const iconMap = {
    package: Package,
    "credit-card": CreditCard,
    "map-pin": MapPin,
    shield: Shield,
    search: Search,
    headphones: HeadphonesIcon,
  } as const;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-ds-text-primary">{helpCenterConfig.title}</h1>
        <p className="mx-auto max-w-2xl text-lg text-ds-text-secondary">
          {helpCenterConfig.description}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mx-auto mb-12 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ds-text-placeholder" />
          <input
            type="text"
            placeholder="Search for help..."
            className="w-full rounded-ds-md border border-ds-border-base py-3 pl-12 pr-4 focus:border-ds-border-focus focus:ring-2 focus:ring-ds-focus-ring/30 dark:text-ds-text-primary"
          />
        </div>
      </div>

      {/* Help Topics Grid */}
      <div className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {helpCenterConfig.topics.map((topic) => {
          const Icon = iconMap[topic.icon];
          return (
            <Link
              key={topic.title}
              href={topic.slug === "contact" ? "/contact" : `/help/${topic.slug}`}
              className="group rounded-ds-md border border-ds-border-base p-6 transition-all hover:border-ds-brand-muted hover:shadow-ds-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-ds-md bg-ds-brand-subtle transition-colors group-hover:bg-ds-brand-subtle">
                <Icon className="h-6 w-6 text-ds-text-brand" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">
                {topic.title}
              </h3>
              <p className="text-sm text-ds-text-secondary">{topic.description}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="rounded-ds-md bg-ds-brand-surface p-8 dark:bg-ds-brand-subtle">
        <h2 className="mb-6 text-2xl font-bold text-ds-text-primary">Quick Links</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {helpCenterConfig.quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 text-ds-text-brand hover:underline"
            >
              → {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Still Need Help */}
      <div className="mt-12 text-center">
        <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">Still Need Help?</h2>
        <p className="mb-6 text-ds-text-secondary">
          Our support team is here to assist you
        </p>
        <Link
          href="/contact"
          className="inline-block rounded-ds-md bg-ds-brand-primary px-6 py-3 font-semibold text-white hover:bg-ds-brand-primary-hover dark:bg-ds-brand-primary dark:hover:bg-ds-brand-primary"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
