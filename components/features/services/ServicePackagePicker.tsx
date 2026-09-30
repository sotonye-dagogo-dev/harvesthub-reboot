"use client";

import { Check } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { resolveOptionLabel } from "@/lib/config/optionLists";
import { SERVICE_LIMITS } from "@/lib/config/serviceFulfillment";
import type { ServiceTierKey } from "@/lib/config/serviceFulfillment";
import type { ServicePackage } from "@/lib/types";

export interface ServicePackagePickerProps {
    packages: ServicePackage[];
    selectedTier: ServiceTierKey;
    onSelectTier: (pkg: ServicePackage) => void;
    /** Titles of the extras the buyer has ticked on the selected package. */
    chosenExtras: string[];
    onToggleExtra: (title: string) => void;
    className?: string;
}

function deliveryLabel(deliveryDays: number): string {
    const days = Number.isFinite(deliveryDays) ? Math.max(1, Math.round(deliveryDays)) : 1;
    return days === 1 ? "1 day delivery" : `${days} days delivery`;
}

function revisionsLabel(revisions: number | null | undefined): string | null {
    if (revisions === null || revisions === undefined) return null;
    if (revisions === SERVICE_LIMITS.revisionsUnlimited) return "Unlimited revisions";
    if (revisions <= 0) return "No revisions";
    return `${revisions} revision${revisions === 1 ? "" : "s"}`;
}

export function ServicePackagePicker({
    packages,
    selectedTier,
    onSelectTier,
    chosenExtras,
    onToggleExtra,
    className,
}: ServicePackagePickerProps) {
    if (packages.length === 0) return null;
    const selected = packages.find((pkg) => pkg.tier === selectedTier) ?? packages[0]!;
    const extras = selected.extras ?? [];

    return (
        <div className={className} role="radiogroup" aria-label="Choose a service package">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {packages.map((pkg) => {
                    const isSelected = pkg.tier === selected.tier;
                    const revisions = revisionsLabel(pkg.revisions);
                    return (
                        <label
                            key={pkg.tier}
                            className={cn(
                                "relative cursor-pointer rounded-ds-md border p-4 transition-colors",
                                isSelected
                                    ? "border-ds-brand-primary bg-ds-brand-surface shadow-ds-sm"
                                    : "border-ds-border-base bg-ds-surface-base hover:border-ds-brand-primary/50"
                            )}
                        >
                            <input
                                type="radio"
                                name="service-package-tier"
                                className="sr-only"
                                checked={isSelected}
                                onChange={() => onSelectTier(pkg)}
                            />
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-ds-text-secondary">
                                        {resolveOptionLabel("serviceTiers", pkg.tier)}
                                    </p>
                                    <p className="mt-0.5 text-sm font-semibold text-ds-text-primary">
                                        {pkg.title}
                                    </p>
                                </div>
                                <span
                                    className={cn(
                                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-ds-full border",
                                        isSelected
                                            ? "border-ds-brand-primary bg-ds-brand-primary text-white"
                                            : "border-ds-border-base bg-ds-surface-base"
                                    )}
                                    aria-hidden="true"
                                >
                                    {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                                </span>
                            </div>
                            <p className="mt-2 text-lg font-bold text-ds-text-brand">
                                {formatCurrency(pkg.price)}
                            </p>
                            <p className="mt-1 text-xs text-ds-text-secondary">
                                {deliveryLabel(pkg.deliveryDays)}
                            </p>
                            {revisions ? (
                                <p className="mt-0.5 text-xs text-ds-text-secondary">{revisions}</p>
                            ) : null}
                            {pkg.description ? (
                                <p className="mt-2 text-xs leading-relaxed text-ds-text-tertiary">
                                    {pkg.description}
                                </p>
                            ) : null}
                        </label>
                    );
                })}
            </div>

            {extras.length > 0 ? (
                <fieldset className="mt-4 rounded-ds-md border border-ds-border-base bg-ds-surface-base p-4">
                    <legend className="px-1 text-sm font-medium text-ds-text-primary">
                        Optional extras
                    </legend>
                    <div className="space-y-2">
                        {extras.map((extra) => {
                            const checked = chosenExtras.includes(extra.title);
                            return (
                                <label
                                    key={extra.title}
                                    className="flex cursor-pointer items-center justify-between gap-3"
                                >
                                    <span className="flex items-center gap-2 text-sm text-ds-text-primary">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => onToggleExtra(extra.title)}
                                            className="h-4 w-4 rounded-ds-xs border-ds-border-base text-ds-text-brand focus:ring-2 focus:ring-ds-focus-ring/20"
                                        />
                                        {extra.title}
                                    </span>
                                    <span className="text-sm font-medium text-ds-text-brand">
                                        +{formatCurrency(extra.price)}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </fieldset>
            ) : null}
        </div>
    );
}
