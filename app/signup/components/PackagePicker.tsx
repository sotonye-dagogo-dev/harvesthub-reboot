"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

export interface SignupPackage {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  durationDays: number;
  features: unknown;
}

interface PackagePickerProps {
  value?: string;
  onChange: (packageId: string | undefined) => void;
  /** Called once packages load, so the parent knows whether picking one is required. */
  onLoaded?: (packages: SignupPackage[]) => void;
  freeListingAllowance?: number;
}

const formatNaira = (amount: number) =>
  "₦" + amount.toLocaleString("en-NG", { maximumFractionDigits: 0 });

const periodLabel = (days: number) => {
  if (days >= 360) return "a year";
  if (days >= 28 && days <= 31) return "a month";
  return `per ${days} days`;
};

const toFeatures = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((f): f is string => typeof f === "string" && f.trim().length > 0)
    : [];

/**
 * Lets a new vendor pick the paid package they will move to. Everyone starts free;
 * the free option is not shown. Payment happens later, when the free listings run out.
 */
export default function PackagePicker({
  value,
  onChange,
  onLoaded,
  freeListingAllowance = 5,
}: PackagePickerProps) {
  const [packages, setPackages] = useState<SignupPackage[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => fetch("/api/subscription-packages"))
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((json) => {
        if (cancelled) return;
        const data = (json?.data ?? json) as { packages?: SignupPackage[] };
        const paid = (data.packages ?? []).filter((p) => Number(p.price) > 0);
        setPackages(paid);
        onLoaded?.(paid);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setPackages([]);
        onLoaded?.([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (packages === null) {
    return <p className="text-sm text-ds-text-secondary">Loading packages…</p>;
  }
  if (packages.length === 0) {
    return failed ? (
      <p className="text-sm text-ds-text-secondary">
        Packages could not be loaded. You can pick one later from your dashboard.
      </p>
    ) : null;
  }

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-ds-text-primary">
        Choose your package <span className="text-ds-status-error-text">*</span>
      </legend>
      <p className="mb-3 text-xs text-ds-text-secondary">
        You start free with up to {freeListingAllowance} listings. You only pay for the package you pick when
        your free listings are used up.
      </p>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Package">
        {packages.map((pkg) => {
          const selected = value === pkg.id;
          const features = toFeatures(pkg.features).slice(0, 4);
          return (
            <button
              key={pkg.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(pkg.id)}
              className={`rounded-ds-md border p-4 text-left transition-colors ${
                selected
                  ? "border-ds-brand-primary bg-ds-brand-surface ring-2 ring-ds-brand-primary/20"
                  : "border-ds-border-base bg-ds-surface-base hover:border-ds-border-strong"
              }`}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-ds-text-primary">{pkg.name}</span>
                <span className="text-sm font-bold text-ds-brand-primary">
                  {formatNaira(pkg.price)}
                  <span className="ml-1 text-xs font-normal text-ds-text-secondary">
                    {periodLabel(pkg.durationDays)}
                  </span>
                </span>
              </span>
              {pkg.description ? (
                <span className="mt-1 block text-xs text-ds-text-secondary">{pkg.description}</span>
              ) : null}
              {features.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-1.5 text-xs text-ds-text-secondary">
                      <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-ds-status-success-text" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
