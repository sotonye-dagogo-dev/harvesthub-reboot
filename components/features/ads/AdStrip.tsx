"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, X } from "lucide-react";
import type { Banner } from "@/lib/types";
import { cn } from "@/lib/utils";
import { resolvePrimaryBannerAction } from "@/lib/utils/bannerActions";
import { trackBannerClick, type BannerTrackingSource } from "@/lib/tracking/bannerTracking";
import { HarvestersCross } from "@/components/brand";

type Variant = "top" | "inline";

const DESIGNED_BACKGROUNDS: Record<string, string> = {
  BUSINESS: "bg-ds-brand-deep",
  PROMOTION: "bg-ds-brand-primary",
  EVENT: "bg-gradient-to-r from-ds-brand-deep to-ds-palette-purple-500",
  CHURCH: "bg-gradient-to-r from-ds-brand-deep via-ds-palette-purple-800 to-ds-palette-magenta-700",
};

function plainText(value: string | null | undefined): string {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

interface AdStripProps {
  banner: Banner;
  variant: Variant;
  trackingSource: BannerTrackingSource;
  /** Shown for sponsored adverts only */
  onDismiss?: () => void;
  className?: string;
}

/**
 * One wide advert creative. Two styles:
 *  - IMAGE: the advertiser's uploaded artwork (cropped to the slot, centred on a neutral band)
 *  - DESIGNED: a MyHarvestHub-branded layout built from title / subtitle / CTA label
 * Sponsored adverts carry a "Sponsored" label and a close button.
 */
export function AdStrip({ banner, variant, trackingSource, onDismiss, className }: AdStripProps) {
  const sponsored = banner.isSponsored === true;
  const designed = banner.displayStyle === "DESIGNED";
  const title = plainText(banner.title);
  const subtitle = plainText(banner.subtitle);
  const ctaLabel = plainText(banner.knowMoreLabel) || "Learn more";
  const action = resolvePrimaryBannerAction({
    actions: banner.actions,
    linkUrl: banner.linkUrl,
    defaultLabel: ctaLabel,
  });
  const label = title || (sponsored ? "Sponsored advert" : "MyHarvestHub promotion");

  const creativeTestId = variant === "top" ? "top-ad-strip" : "sponsored-inline-ad";

  const creative: ReactNode = designed ? (
    <div
      data-testid={creativeTestId}
      className={cn(
        "relative flex w-full items-center overflow-hidden text-white",
        DESIGNED_BACKGROUNDS[banner.theme ?? "BUSINESS"] ?? DESIGNED_BACKGROUNDS.BUSINESS,
        variant === "top"
          ? "h-11 justify-center gap-3 px-10 sm:h-12"
          : "min-h-[6.5rem] flex-col items-start justify-center gap-1 rounded-ds-md px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8"
      )}
    >
      <HarvestersCross
        size={variant === "top" ? 70 : 150}
        title=""
        className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 text-white opacity-10"
      />
      <div className={cn("relative min-w-0", variant === "top" ? "flex items-baseline gap-2" : "")}>
        <p className={cn("truncate font-semibold text-white", variant === "top" ? "text-sm" : "text-lg sm:text-xl")}>
          {title}
        </p>
        {subtitle ? (
          <p
            className={cn(
              "truncate text-ds-palette-purple-100",
              variant === "top" ? "hidden text-xs md:block" : "mt-0.5 text-sm"
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? (
        <span
          className={cn(
            "relative inline-flex flex-shrink-0 items-center gap-1 rounded-ds-full bg-white font-semibold text-ds-brand-deep",
            variant === "top" ? "px-3 py-1 text-xs" : "mt-2 px-4 py-2 text-sm sm:mt-0"
          )}
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      ) : null}
    </div>
  ) : (
    <div
      data-testid={creativeTestId}
      className={cn(
        "relative mx-auto w-full overflow-hidden",
        variant === "top" ? "h-11 max-w-6xl sm:h-12" : "aspect-[64/10] min-h-[4rem] rounded-ds-md"
      )}
    >
      <Image
        src={banner.imageUrl}
        alt={label}
        fill
        className="object-cover object-center"
        sizes={variant === "top" ? "(min-width: 1152px) 1152px, 100vw" : "(min-width: 1280px) 1200px, 100vw"}
        priority={variant === "top"}
      />
    </div>
  );

  const handleClick = () => trackBannerClick(banner.id, trackingSource, { conversion: true });

  const linked = action ? (
    action.openInNewTab || action.href.startsWith("http") ? (
      <a
        href={action.href}
        target={action.openInNewTab || action.href.startsWith("http") ? "_blank" : undefined}
        rel={sponsored ? "noopener noreferrer sponsored" : "noopener noreferrer"}
        onClick={handleClick}
        aria-label={label}
        className="block transition-opacity hover:opacity-95"
      >
        {creative}
      </a>
    ) : (
      <Link href={action.href} onClick={handleClick} aria-label={label} className="block transition-opacity hover:opacity-95">
        {creative}
      </Link>
    )
  ) : (
    <div aria-label={label}>{creative}</div>
  );

  return (
    <div
      data-testid={variant === "top" ? "top-ad-slot" : "sponsored-inline-slot"}
      role="region"
      aria-label={sponsored ? "Sponsored advert" : "Promotion"}
      className={cn(
        "relative w-full",
        // Neutral band so third-party artwork never butts up against the brand header
        variant === "top" && !designed && (sponsored ? "bg-ds-palette-neutral-100 dark:bg-ds-surface-raised" : "bg-ds-brand-deep"),
        className
      )}
    >
      {linked}

      {sponsored ? (
        <span
          className={cn(
            "pointer-events-none absolute rounded-ds-xs bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white",
            variant === "top" ? "left-2 top-1/2 -translate-y-1/2" : "left-2 top-2"
          )}
        >
          Sponsored
        </span>
      ) : null}

      {sponsored && onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Hide this advert"
          className={cn(
            "absolute flex h-6 w-6 items-center justify-center rounded-ds-full bg-black/60 text-white transition-colors hover:bg-black/80",
            variant === "top" ? "right-2 top-1/2 -translate-y-1/2" : "right-2 top-2"
          )}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export default AdStrip;
