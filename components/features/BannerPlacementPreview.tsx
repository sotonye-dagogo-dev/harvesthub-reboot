"use client";

import Image from "next/image";

type BannerPreviewPosition = "TOP" | "HERO" | "SIDEBAR";

interface BannerPlacementPreviewProps {
  imageUrl?: string | null;
  title?: string | null;
  position: BannerPreviewPosition;
}

function PreviewFrame({
  label,
  className,
  imageUrl,
  title,
}: {
  label: string;
  className: string;
  imageUrl?: string | null;
  title: string;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ds-text-tertiary">{label}</p>
      <div className={`relative overflow-hidden rounded-ds-md border border-ds-border-base bg-ds-surface-sunken ${className}`}>
        {imageUrl ? (
          <Image src={imageUrl} alt={`${label} banner preview`} fill className="object-contain" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-ds-text-tertiary">
            Upload an image to preview this placement.
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/40 px-2 py-1 text-[10px] text-white">
          {title}
        </div>
      </div>
    </div>
  );
}

export function BannerPlacementPreview({
  imageUrl,
  title,
  position,
}: BannerPlacementPreviewProps) {
  const previewTitle =
    title && title.trim().length > 0
      ? title.trim()
      : position === "TOP"
        ? "Top banner preview"
        : "Banner preview";

  return (
    <div className="rounded-ds-md border border-ds-border-base bg-ds-surface-muted p-3">
      <p className="mb-2 text-sm font-medium text-ds-text-primary">Frontend Preview</p>
      {position === "TOP" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <PreviewFrame label="Desktop top strip" className="aspect-[64/10] max-h-[84px]" imageUrl={imageUrl} title={previewTitle} />
          <PreviewFrame label="Mobile top strip" className="aspect-[64/10] max-h-[64px]" imageUrl={imageUrl} title={previewTitle} />
        </div>
      ) : position === "SIDEBAR" ? (
        <PreviewFrame label="Sidebar card" className="aspect-[3/4] max-h-[260px] w-full sm:max-w-[240px]" imageUrl={imageUrl} title={previewTitle} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <PreviewFrame label="Desktop hero" className="aspect-[5/2]" imageUrl={imageUrl} title={previewTitle} />
          <PreviewFrame label="Mobile hero" className="aspect-[5/2]" imageUrl={imageUrl} title={previewTitle} />
        </div>
      )}
    </div>
  );
}
