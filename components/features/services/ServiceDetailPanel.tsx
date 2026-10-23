"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Globe, MapPin } from "lucide-react";
import { Button } from "@/components/ui";
import { servicePackageTotal, useCart } from "@/lib/store/cartStore";
import { useToast } from "@/lib/contexts/ToastContext";
import { useGuestGuard } from "@/lib/hooks/useGuestGuard";
import { cn, formatCurrency } from "@/lib/utils";
import { SERVICE_UNLIMITED_STOCK } from "@/lib/constants";
import { SERVICE_TIER_KEYS, isRequirementFieldType, isServiceTierKey } from "@/lib/config/serviceFulfillment";
import type { ServiceTierKey } from "@/lib/config/serviceFulfillment";
import { resolveOptionLabel } from "@/lib/config/optionLists";
import type {
    ServiceDetails,
    ServiceGeo,
    ServicePackage,
    ServicePackageExtra,
    ServiceRequirementField,
    WeeklySlot,
} from "@/lib/types";
import { ServicePackagePicker } from "./ServicePackagePicker";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const REQUIREMENT_TYPE_HINTS: Record<string, string> = {
    TEXT: "Text answer",
    SELECT: "Choice",
    FILE: "File upload",
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
    value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;

const asFiniteNumber = (value: unknown): number | null => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

const asOptionalString = (value: unknown): string | undefined =>
    typeof value === "string" && value.trim().length > 0 ? value : undefined;

/**
 * Lenient structural read of a `Product.serviceDetails` JSON value.
 *
 * The panel must render real (including booking-era and partially migrated)
 * rows rather than refuse them, so this coerces field by field instead of
 * running the strict zod schema. Returns `null` only when the payload is not
 * an object — callers then fall back to the plain product view.
 */
export function parseServiceDetails(raw: unknown): ServiceDetails | null {
    const src = asRecord(raw);
    if (!src) return null;

    const details: ServiceDetails = {
        deliveryMode: src.deliveryMode === "ON_SITE" ? "ON_SITE" : "DIGITAL",
    };

    const draftStep = asFiniteNumber(src.draftStep);
    if (draftStep !== null && Number.isInteger(draftStep)) details.draftStep = draftStep;
    if (typeof src.description === "string") details.description = src.description;
    if (typeof src.shortDescription === "string") details.shortDescription = src.shortDescription;

    if (typeof src.serviceCategory === "string") {
        details.serviceCategory = src.serviceCategory as ServiceDetails["serviceCategory"];
    }
    if (typeof src.rateType === "string") {
        details.rateType = src.rateType as ServiceDetails["rateType"];
    }
    if (typeof src.location === "string") {
        details.location = src.location as ServiceDetails["location"];
    }
    const rate = asFiniteNumber(src.rate);
    if (rate !== null) details.rate = rate;
    if (src.durationMinutes !== undefined) {
        const duration = asFiniteNumber(src.durationMinutes);
        details.durationMinutes = duration === null ? null : Math.round(duration);
    }
    if (src.maxBookingsPerDay !== undefined) {
        const max = asFiniteNumber(src.maxBookingsPerDay);
        details.maxBookingsPerDay = max === null ? null : Math.round(max);
    }
    if (typeof src.requiresConsultation === "boolean") {
        details.requiresConsultation = src.requiresConsultation;
    }

    if (Array.isArray(src.packages)) {
        const usedTiers = new Set<ServiceTierKey>();
        const packages: ServicePackage[] = [];
        src.packages.forEach((entry, index) => {
            const pkg = asRecord(entry);
            if (!pkg) return;
            const price = asFiniteNumber(pkg.price);
            if (price === null || price < 0) return;
            let tier: ServiceTierKey | undefined = isServiceTierKey(pkg.tier) ? pkg.tier : undefined;
            if (tier && usedTiers.has(tier)) tier = undefined;
            if (!tier) {
                // Positional fallback for malformed/legacy tiers.
                tier = SERVICE_TIER_KEYS.find((key) => !usedTiers.has(key) && key === SERVICE_TIER_KEYS[index])
                    ?? SERVICE_TIER_KEYS.find((key) => !usedTiers.has(key));
            }
            if (!tier) return;
            usedTiers.add(tier);

            const extras: ServicePackageExtra[] = [];
            if (Array.isArray(pkg.extras)) {
                pkg.extras.forEach((entryExtra) => {
                    const extra = asRecord(entryExtra);
                    if (!extra) return;
                    const extraPrice = asFiniteNumber(extra.price);
                    const title = typeof extra.title === "string" ? extra.title.trim() : "";
                    if (!title || extraPrice === null || extraPrice < 0) return;
                    extras.push({ title, price: extraPrice });
                });
            }

            const deliveryDays = asFiniteNumber(pkg.deliveryDays);
            const revisions = asFiniteNumber(pkg.revisions);
            packages.push({
                tier,
                title:
                    typeof pkg.title === "string" && pkg.title.trim().length > 0
                        ? pkg.title.trim()
                        : resolveOptionLabel("serviceTiers", tier),
                description: typeof pkg.description === "string" ? pkg.description : "",
                price,
                deliveryDays:
                    deliveryDays === null ? 1 : Math.min(Math.max(Math.round(deliveryDays), 1), 90),
                revisions: revisions === null ? null : Math.round(revisions),
                extras,
            });
        });
        if (packages.length > 0) {
            packages.sort(
                (a, b) => SERVICE_TIER_KEYS.indexOf(a.tier) - SERVICE_TIER_KEYS.indexOf(b.tier)
            );
            details.packages = packages;
        }
    }

    if (Array.isArray(src.requirementFields)) {
        const fields: ServiceRequirementField[] = [];
        src.requirementFields.forEach((entry, index) => {
            const field = asRecord(entry);
            if (!field) return;
            const label = typeof field.label === "string" ? field.label.trim() : "";
            const key =
                typeof field.key === "string" && field.key.trim().length > 0
                    ? field.key.trim()
                    : `FIELD_${index + 1}`;
            if (!label) return;
            const type = isRequirementFieldType(field.type) ? field.type : "TEXT";
            const options =
                type === "SELECT" && Array.isArray(field.options)
                    ? field.options.filter(
                          (opt): opt is string => typeof opt === "string" && opt.trim().length > 0
                      )
                    : undefined;
            fields.push({
                key,
                label,
                type,
                options,
                required: field.required !== false,
            });
        });
        details.requirementFields = fields;
    }

    if (Array.isArray(src.availableSlots)) {
        const slots: WeeklySlot[] = [];
        src.availableSlots.forEach((entry, index) => {
            const slot = asRecord(entry);
            if (!slot) return;
            const day = asFiniteNumber(slot.dayOfWeek);
            const startTime = typeof slot.startTime === "string" ? slot.startTime : null;
            const endTime = typeof slot.endTime === "string" ? slot.endTime : null;
            if (day === null || !Number.isInteger(day) || day < 0 || day > 6) return;
            if (!startTime || !endTime) return;
            slots.push({
                id: typeof slot.id === "string" && slot.id ? slot.id : `slot-${index}`,
                dayOfWeek: day,
                startTime,
                endTime,
                isAvailable: slot.isAvailable !== false,
            });
        });
        details.availableSlots = slots;
    }

    const geoSrc = asRecord(src.geo);
    const geoAddress = geoSrc ? asOptionalString(geoSrc.address) : undefined;
    if (geoSrc && geoAddress) {
        const geo: ServiceGeo = { address: geoAddress };
        const lat = asFiniteNumber(geoSrc.lat);
        const lng = asFiniteNumber(geoSrc.lng);
        if (lat !== null && lat >= -90 && lat <= 90) geo.lat = lat;
        if (lng !== null && lng >= -180 && lng <= 180) geo.lng = lng;
        if (typeof geoSrc.campus === "string") geo.campus = geoSrc.campus as ServiceGeo["campus"];
        const landmark = asOptionalString(geoSrc.landmark);
        if (landmark) geo.landmark = landmark;
        details.geo = geo;
    }

    return details;
}

/** Cheapest published tier — the "From" price on the product page. */
export function minServicePackagePrice(details: ServiceDetails): number | null {
    const packages = details.packages ?? [];
    if (packages.length === 0) return null;
    return packages.reduce(
        (min, pkg) => (Number.isFinite(pkg.price) ? Math.min(min, pkg.price) : min),
        Number.POSITIVE_INFINITY
    );
}

export interface ServiceDetailPanelProps {
    productId: string;
    name: string;
    /** Listing price (base). The cart line reprices from the chosen package. */
    price: number;
    images?: string[] | null;
    vendorId: string;
    vendorName?: string | null;
    details: ServiceDetails;
}

export function ServiceDetailPanel({
    productId,
    name,
    price,
    images,
    vendorId,
    vendorName,
    details,
}: ServiceDetailPanelProps) {
    const { addItem } = useCart();
    const toast = useToast();
    const { requireAuth } = useGuestGuard();

    const packages = useMemo(() => details.packages ?? [], [details.packages]);
    const [selectedTier, setSelectedTier] = useState<ServiceTierKey | null>(
        () => packages[0]?.tier ?? null
    );
    const [chosenExtras, setChosenExtras] = useState<string[]>([]);

    const selectedPackage =
        packages.find((pkg) => pkg.tier === selectedTier) ?? packages[0] ?? null;

    const assembledPackage: ServicePackage | null = selectedPackage
        ? {
              ...selectedPackage,
              extras: (selectedPackage.extras ?? []).filter((extra) =>
                  chosenExtras.includes(extra.title)
              ),
          }
        : null;

    const packageTotal = assembledPackage ? servicePackageTotal(assembledPackage) : null;
    const isOnSite = details.deliveryMode === "ON_SITE";

    const requirementFields = details.requirementFields ?? [];
    const availableSlots = useMemo(
        () => (details.availableSlots ?? []).filter((slot) => slot.isAvailable),
        [details.availableSlots]
    );
    const slotsByDay = useMemo(() => {
        const grouped = new Map<number, WeeklySlot[]>();
        for (const slot of availableSlots) {
            const list = grouped.get(slot.dayOfWeek) ?? [];
            list.push(slot);
            grouped.set(slot.dayOfWeek, list);
        }
        return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
    }, [availableSlots]);

    const handleSelectTier = (pkg: ServicePackage) => {
        setSelectedTier(pkg.tier);
        setChosenExtras([]);
    };

    const handleToggleExtra = (title: string) => {
        setChosenExtras((prev) =>
            prev.includes(title) ? prev.filter((entry) => entry !== title) : [...prev, title]
        );
    };

    const handleAddToCart = () => {
        if (!requireAuth("add services to your cart")) return;
        if (!assembledPackage || packageTotal === null) {
            toast.error("Choose a package first");
            return;
        }
        addItem({
            productId,
            name,
            price,
            image: (Array.isArray(images) && images[0]) || "/placeholder-product.jpg",
            vendorId,
            vendorName: vendorName || "Vendor",
            stock: SERVICE_UNLIMITED_STOCK,
            isService: true,
            selectedPackage: assembledPackage,
            serviceDeliveryMode: details.deliveryMode ?? "DIGITAL",
            quantity: 1,
            selectedVariants: null,
        });
        toast.success(`${name} (${assembledPackage.title}) added to cart`);
    };

    return (
        <div className="mt-6 space-y-4" data-testid="service-detail-panel">
            <div className="flex flex-wrap items-center gap-2">
                <span
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                        isOnSite
                            ? "bg-ds-status-warning-bg text-ds-status-warning-text"
                            : "bg-ds-status-info-bg text-ds-status-info-text"
                    )}
                >
                    {isOnSite ? <MapPin className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                    {isOnSite ? "On-site service" : "Delivered digitally"}
                </span>
                {isOnSite ? (
                    <span className="text-xs text-ds-text-secondary">
                        {details.geo?.address
                            ? `Vendor comes to: ${details.geo.address}`
                            : "Your address will be required at checkout"}
                    </span>
                ) : (
                    <span className="text-xs text-ds-text-secondary">
                        Coordinated with the vendor after ordering
                    </span>
                )}
            </div>

            <div>
                <h3 className="mb-3 text-sm font-semibold text-ds-text-primary">
                    Choose your package
                </h3>
                <ServicePackagePicker
                    packages={packages}
                    selectedTier={selectedPackage?.tier ?? "BASIC"}
                    onSelectTier={handleSelectTier}
                    chosenExtras={chosenExtras}
                    onToggleExtra={handleToggleExtra}
                />
            </div>

            {slotsByDay.length > 0 ? (
                <div>
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ds-text-primary">
                        <CalendarClock className="h-4 w-4" /> Availability
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {slotsByDay.map(([day, slots]) => (
                            <div
                                key={day}
                                className="rounded-ds-md border border-ds-border-base bg-ds-surface-base px-3 py-2 text-xs text-ds-text-secondary"
                            >
                                <span className="font-medium text-ds-text-primary">
                                    {DAY_NAMES[day] ?? day}
                                </span>
                                <div className="mt-1 space-y-0.5">
                                    {slots.map((slot) => (
                                        <span key={slot.id} className="block">
                                            {slot.startTime} – {slot.endTime}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {requirementFields.length > 0 ? (
                <div className="rounded-ds-md border border-ds-border-base bg-ds-surface-base p-4">
                    <h3 className="text-sm font-semibold text-ds-text-primary">
                        What I&apos;ll need from you
                    </h3>
                    <p className="mt-1 text-xs text-ds-text-secondary">
                        The vendor may ask for these details before starting. Have them ready after
                        checkout.
                    </p>
                    <ul className="mt-2 space-y-1.5">
                        {requirementFields.map((field) => (
                            <li
                                key={field.key}
                                className="flex items-center justify-between gap-3 text-sm text-ds-text-primary"
                            >
                                <span>
                                    {field.label}
                                    {field.required ? null : (
                                        <span className="text-xs text-ds-text-tertiary"> (optional)</span>
                                    )}
                                </span>
                                <span className="text-xs text-ds-text-tertiary">
                                    {REQUIREMENT_TYPE_HINTS[field.type] ?? "Text answer"}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            <div className="flex items-center justify-between gap-4 rounded-ds-md border border-ds-brand-primary/40 bg-ds-brand-surface p-4">
                <div>
                    <p className="text-xs text-ds-text-secondary">
                        {assembledPackage
                            ? `${assembledPackage.title} · ${resolveOptionLabel(
                                  "serviceTiers",
                                  assembledPackage.tier
                              )}`
                            : "Select a package"}
                    </p>
                    <p
                        className="text-xl font-bold text-ds-text-brand"
                        data-testid="service-total"
                    >
                        {packageTotal !== null ? formatCurrency(packageTotal) : "—"}
                    </p>
                </div>
                <Button
                    onClick={handleAddToCart}
                    disabled={assembledPackage === null}
                    className="bg-ds-brand-primary text-white"
                >
                    Add Service to Cart
                </Button>
            </div>
        </div>
    );
}
