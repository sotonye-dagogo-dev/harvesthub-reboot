"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Package, CreditCard, MapPin, Shield, HeadphonesIcon, X } from "lucide-react";
import { helpCenterConfig } from "@/lib/config/siteContent";

const iconMap = {
  package: Package,
  "credit-card": CreditCard,
  "map-pin": MapPin,
  shield: Shield,
  search: Search,
  headphones: HeadphonesIcon,
} as const;

export default function HelpCenterClient() {
  const [query, setQuery] = useState("");

  const normalized = query.trim().toLowerCase();

  const filteredTopics = useMemo(() => {
    if (!normalized) return helpCenterConfig.topics;
    return helpCenterConfig.topics.filter((topic) => {
      const hay = `${topic.title} ${topic.description} ${topic.slug}`.toLowerCase();
      return hay.includes(normalized);
    });
  }, [normalized]);

  const filteredQuickLinks = useMemo(() => {
    if (!normalized) return helpCenterConfig.quickLinks;
    return helpCenterConfig.quickLinks.filter((link) => link.label.toLowerCase().includes(normalized) || link.href.toLowerCase().includes(normalized));
  }, [normalized]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-ds-text-primary">{helpCenterConfig.title}</h1>
        <p className="mx-auto max-w-2xl text-lg text-ds-text-secondary">{helpCenterConfig.description}</p>
      </div>

      {/* Search Bar */}
      <div className="mx-auto mb-8 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ds-text-placeholder" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for help..."
            aria-label="Search help articles"
            className="w-full rounded-ds-md border border-ds-border-base py-3 pl-12 pr-10 focus:border-ds-border-focus focus:ring-2 focus:ring-ds-focus-ring/30 dark:text-ds-text-primary"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ds-text-tertiary hover:bg-ds-surface-sunken hover:text-ds-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {normalized ? (
          <p className="mt-2 text-center text-xs text-ds-text-tertiary">
            {filteredTopics.length === 0 && filteredQuickLinks.length === 0
              ? `No results for "${query}"`
              : `Showing ${filteredTopics.length} topic${filteredTopics.length === 1 ? "" : "s"}${filteredQuickLinks.length ? ` and ${filteredQuickLinks.length} link${filteredQuickLinks.length === 1 ? "" : "s"}` : ""} for "${query}"`}
          </p>
        ) : null}
      </div>

      {/* Help Topics Grid */}
      {filteredTopics.length > 0 ? (
        <div className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTopics.map((topic) => {
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
                <h3 className="mb-2 text-xl font-semibold text-ds-text-primary">{topic.title}</h3>
                <p className="text-sm text-ds-text-secondary">{topic.description}</p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mb-16 rounded-ds-md border border-dashed border-ds-border-base p-8 text-center">
          <p className="text-sm font-medium text-ds-text-secondary">No help topics match your search.</p>
          <p className="mt-1 text-xs text-ds-text-tertiary">Try keywords like orders, payments, wallet, pickup, or account.</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-3 text-sm font-medium text-ds-text-brand hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Quick Links */}
      <div className="rounded-ds-md bg-ds-brand-surface p-8 dark:bg-ds-brand-subtle">
        <h2 className="mb-6 text-2xl font-bold text-ds-text-primary">Quick Links</h2>
        {filteredQuickLinks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredQuickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="flex items-center gap-3 text-ds-text-brand hover:underline">
                → {link.label}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ds-text-tertiary">No quick links match your search.</p>
        )}
      </div>

      {/* Still Need Help */}
      <div className="mt-12 text-center">
        <h2 className="mb-4 text-2xl font-bold text-ds-text-primary">Still Need Help?</h2>
        <p className="mb-6 text-ds-text-secondary">Our support team is here to assist you</p>
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
