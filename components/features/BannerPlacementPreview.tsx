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
  testId,
  showTitleOverlay = true,
}: {
  label: string;
  className: string;
  imageUrl?: string | null;
  title: string;
  testId?: string;
  showTitleOverlay?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ds-text-tertiary">{label}</p>
      <div
        data-testid={testId}
        className={`relative overflow-hidden rounded-ds-md border border-ds-border-base bg-ds-surface-sunken ${className}`}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={`${label} banner preview`} fill className="object-fill" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-ds-text-tertiary">
            Upload an image to preview this placement.
          </div>
        )}
        {showTitleOverlay ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/40 px-2 py-1 text-[10px] text-white">
            {title}
          </div>
        ) : null}
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
      <p className="mb-2 text-xs text-ds-text-secondary">
        Images are rendered fill-first in banner containers. Use recommended placement dimensions to avoid
        stretching.
      </p>
      {position === "TOP" ? (
        <>
          <p className="mb-2 text-xs text-ds-text-secondary">
            Top placement is image-only at runtime (no title overlay).
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <PreviewFrame
              label="Desktop top strip"
              className="aspect-[64/10] max-h-[44px]"
              imageUrl={imageUrl}
              title={previewTitle}
              testId="banner-preview-top-desktop"
              showTitleOverlay={false}
            />
            <PreviewFrame
              label="Mobile top strip"
              className="aspect-[64/10] max-h-[36px]"
              imageUrl={imageUrl}
              title={previewTitle}
              testId="banner-preview-top-mobile"
              showTitleOverlay={false}
            />
          </div>
        </>
      ) : position === "SIDEBAR" ? (
        <PreviewFrame
          label="Sidebar card"
          className="aspect-square max-h-[180px] w-full sm:max-w-[180px]"
          imageUrl={imageUrl}
          title={previewTitle}
          testId="banner-preview-sidebar"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <PreviewFrame
            label="Desktop hero"
            className="aspect-[11/4]"
            imageUrl={imageUrl}
            title={previewTitle}
            testId="banner-preview-hero-desktop"
          />
          <PreviewFrame
            label="Mobile hero"
            className="aspect-[2/1]"
            imageUrl={imageUrl}
            title={previewTitle}
            testId="banner-preview-hero-mobile"
          />
        </div>
      )}
    </div>
  );
}
