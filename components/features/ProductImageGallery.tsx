"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";

interface Props {
  images: string[];
  alt: string;
}

export default function ProductImageGallery({ images, alt }: Props) {
  const valid = Array.isArray(images) ? images.filter((u) => typeof u === "string" && u.trim().length > 0) : [];
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const count = valid.length;
  const current = count > 0 ? valid[Math.min(index, count - 1)]! : null;
  const viewportRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(() => setIndex((i) => (count === 0 ? 0 : (i - 1 + count) % count)), [count]);
  const next = useCallback(() => setIndex((i) => (count === 0 ? 0 : (i + 1) % count)), [count]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightbox) {
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
        if (e.key === "Escape") setLightbox(false);
        return;
      }
      // Only when gallery focused? Allow globally when multiple images
      if (count > 1 && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        // avoid hijacking when typing in inputs
        const target = e.target as HTMLElement;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [count, lightbox, next, prev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const diff = endX - touchStartX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) prev();
      else next();
    }
    touchStartX.current = null;
  };

  if (!current) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-ds-md border border-ds-border-base bg-ds-surface-sunken text-ds-text-secondary">
        No image available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main viewport — film strip slider */}
      <div
        ref={viewportRef}
        className="group relative overflow-hidden rounded-ds-md border border-ds-border-base bg-ds-surface-base"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative aspect-square w-full overflow-hidden">
          {/* Track */}
          <div
            className="flex h-full w-full transition-transform duration-500 ease-in-out will-change-transform"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {valid.map((src, i) => (
              <div key={`${src}-${i}`} className="relative h-full w-full flex-shrink-0 basis-full">
                <Image
                  src={src}
                  alt={`${alt} ${i + 1}`}
                  fill
                  className="object-cover"
                  priority={i === 0}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        </div>

        {/* DS-compliant nav buttons */}
        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-ds-border-base bg-ds-surface-base/90 p-2 text-ds-text-primary shadow-ds-sm backdrop-blur-sm transition-colors hover:bg-ds-surface-raised hover:text-ds-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring dark:bg-ds-surface-raised/90 dark:text-ds-text-primary dark:hover:bg-ds-surface-overlay"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-ds-border-base bg-ds-surface-base/90 p-2 text-ds-text-primary shadow-ds-sm backdrop-blur-sm transition-colors hover:bg-ds-surface-raised hover:text-ds-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring dark:bg-ds-surface-raised/90 dark:text-ds-text-primary dark:hover:bg-ds-surface-overlay"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            {/* Dots — DS brand */}
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-ds-border-base bg-ds-surface-base/85 px-2.5 py-1.5 shadow-ds-sm backdrop-blur-sm dark:bg-ds-surface-raised/85">
              {valid.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to image ${i + 1}`}
                  aria-current={i === index}
                  className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring ${
                    i === index ? "w-5 bg-ds-brand-primary" : "w-1.5 bg-ds-text-tertiary/50 hover:bg-ds-text-tertiary/70"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Expand image"
          className="absolute right-3 top-3 rounded-full border border-ds-border-base bg-ds-surface-base/90 p-1.5 text-ds-text-primary shadow-ds-sm transition-colors hover:bg-ds-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring dark:bg-ds-surface-raised/90"
        >
          <Expand className="h-4 w-4" />
        </button>
      </div>

      {/* Thumbnails — film strip scrollable */}
      {count > 1 ? (
        <div
          className="flex gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 scrollbar-thin"
          role="tablist"
          aria-label="Product images"
        >
          {valid.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`View image ${i + 1} of ${count}`}
              onClick={() => setIndex(i)}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-ds-sm border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus-ring ${
                i === index
                  ? "border-ds-brand-primary ring-1 ring-ds-brand-primary"
                  : "border-ds-border-base hover:border-ds-border-strong hover:opacity-90"
              }`}
            >
              <Image src={src} alt={`${alt} ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {/* Lightbox with same film strip */}
      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <div
            className="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex-1 overflow-hidden rounded-ds-md bg-black">
              <div
                className="flex h-full w-full transition-transform duration-500 ease-in-out will-change-transform"
                style={{ transform: `translateX(-${index * 100}%)` }}
              >
                {valid.map((src, i) => (
                  <div key={`lb-${src}-${i}`} className="relative h-full w-full flex-shrink-0 basis-full">
                    <Image src={src} alt={alt} fill className="object-contain" />
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="absolute right-2 top-2 rounded-full border border-ds-border-base bg-ds-surface-base px-3 py-1 text-sm font-medium text-ds-text-primary shadow-ds-sm hover:bg-ds-surface-sunken"
            >
              Close
            </button>
            {count > 1 ? (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-ds-border-base bg-ds-surface-base/90 p-2 text-ds-text-primary shadow-ds-sm backdrop-blur-sm hover:bg-ds-surface-raised"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-ds-border-base bg-ds-surface-base/90 p-2 text-ds-text-primary shadow-ds-sm backdrop-blur-sm hover:bg-ds-surface-raised"
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="mt-3 flex justify-center gap-1.5">
                  {valid.map((_, i) => (
                    <span
                      key={`lb-dot-${i}`}
                      className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
