"use client";
import { useState } from "react";
import { Button } from "@/components/ui";

type Props = { slug: string };

const CONFIG: Record<string, { title: string; steps: string[]; cta: { label: string; href: string }[] }> = {
  orders: {
    title: "Try It — Orders Sandbox",
    steps: ["Add a product with size M to cart, add same product with size L as second line.", "Adjust quantities per size in cart.", "Checkout with Bank Transfer → upload a sample receipt."],
    cta: [{ label: "Browse Products", href: "/products" }, { label: "View Cart", href: "/cart" }],
  },
  payments: {
    title: "Try It — Payments Sandbox",
    steps: ["Open Wallet → Deposit → simulate top-up.", "Place test order with Bank Transfer and upload receipt.", "As vendor, verify receipt to advance order."],
    cta: [{ label: "Wallet", href: "/wallet" }, { label: "Checkout", href: "/checkout" }],
  },
  locations: {
    title: "Try It — Locations Sandbox",
    steps: ["Add an address with a campus in Profile.", "Checkout and observe campus at delivery step."],
    cta: [{ label: "Profile Addresses", href: "/profile" }],
  },
  account: {
    title: "Try It — Account Sandbox",
    steps: ["Go to Profile → Security → change password flow.", "Change email and observe verification step."],
    cta: [{ label: "Profile", href: "/profile" }],
  },
  products: {
    title: "Try It — Products Sandbox",
    steps: ["Create a product with size options (vendor).", "As buyer, add different sizes as separate cart lines."],
    cta: [{ label: "Become a Vendor", href: "/become-vendor" }, { label: "Products", href: "/products" }],
  },
  contact: {
    title: "Try It — Contact Sandbox",
    steps: ["Open Contact → start WhatsApp flow.", "Submit a bug report and follow its lifecycle."],
    cta: [{ label: "Contact", href: "/contact" }, { label: "Report a Bug", href: "/bug-report" }],
  },
};

export default function HelpSandbox({ slug }: Props) {
  const cfg = CONFIG[slug];
  const [checked, setChecked] = useState<boolean[]>(() => (cfg ? cfg.steps.map(() => false) : []));
  if (!cfg) return null;
  const progress = checked.filter(Boolean).length;
  return (
    <div className="rounded-ds-md border border-ds-border-base bg-ds-surface-base p-5">
      <h3 className="font-semibold text-ds-text-primary">{cfg.title}</h3>
      <p className="mt-1 text-xs text-ds-text-tertiary">Interactive checklist — concise directives for buyers and vendors. Progress: {progress}/{cfg.steps.length}</p>
      <ul className="mt-3 space-y-2">
        {cfg.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={checked[i] ?? false} onChange={(e) => setChecked((prev) => { const n = [...prev]; n[i] = e.target.checked; return n; })} className="mt-1" aria-label={`Step ${i + 1}`} />
            <span className={checked[i] ? "text-ds-text-tertiary line-through" : "text-ds-text-secondary"}>{step}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        {cfg.cta.map((c) => (
          <a key={c.href} href={c.href} className="rounded-ds-md border border-ds-border-base px-3 py-1.5 text-xs font-medium text-ds-text-brand hover:bg-ds-brand-surface">{c.label}</a>
        ))}
        <Button variant="outline" size="sm" onClick={() => setChecked(cfg.steps.map(() => false))}>Reset</Button>
      </div>
    </div>
  );
}
