import { AD_BANNER_DIMENSIONS } from "@/lib/constants";

type BannerImageGuidelinesProps = {
  className?: string;
  title?: string;
  subtitle?: string;
};

const PLACEMENT_GUIDES = [
  {
    key: "topBanner",
    label: "Top banner",
    slot: "Top strip",
  },
  {
    key: "heroBanner",
    label: "Hero banner",
    slot: "Homepage hero",
  },
  {
    key: "sidebarBanner",
    label: "Sidebar banner",
    slot: "Sidebar card",
  },
] as const;

export function BannerImageGuidelines({
  className,
  title = "Image Guidelines",
  subtitle,
}: BannerImageGuidelinesProps) {
  const containerClassName = [
    "rounded-ds-md border border-ds-border-base bg-ds-surface-muted p-4",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={containerClassName}>
      <h2 className="text-base font-semibold text-ds-text-primary">{title}</h2>
      {subtitle ? <p className="mt-1 text-xs text-ds-text-secondary">{subtitle}</p> : null}
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {PLACEMENT_GUIDES.map((guide) => {
          const dimensions = AD_BANNER_DIMENSIONS[guide.key];
          return (
            <div
              key={guide.key}
              className="rounded-ds-md border border-ds-border-base bg-ds-surface-base p-3"
            >
              <p className="text-sm font-semibold text-ds-text-primary">{guide.label}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ds-text-tertiary">
                {guide.slot}
              </p>
              <p className="mt-2 text-xs text-ds-text-secondary">
                Recommended: {dimensions.recommended.width}x{dimensions.recommended.height} (
                {dimensions.recommended.ratio})
              </p>
              <p className="text-xs text-ds-text-secondary">
                Minimum: {dimensions.min.width}x{dimensions.min.height}
              </p>
              <p className="text-xs text-ds-text-secondary">
                Maximum: {dimensions.max.width}x{dimensions.max.height}
              </p>
              <p className="mt-2 text-xs text-ds-text-tertiary">{dimensions.recommended.note}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-ds-text-secondary">
        File size: max 1MB. Prefer WebP or AVIF.
      </p>
    </section>
  );
}
