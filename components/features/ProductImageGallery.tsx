"use client";
import { useState, useCallback } from "react";
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

  const prev = useCallback(() => setIndex((i) => (count === 0 ? 0 : (i - 1 + count) % count)), [count]);
  const next = useCallback(() => setIndex((i) => (count === 0 ? 0 : (i + 1) % count)), [count]);

  if (!current) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-ds-md border border-ds-border-base bg-ds-surface-sunken text-ds-text-secondary">
        No image available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="group relative overflow-hidden rounded-ds-md border border-ds-border-base bg-ds-surface-base">
        <div className="relative aspect-square">
          <Image src={current} alt={alt} fill className="object-cover transition duration-300" priority />
        </div>
        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-2 py-1">
              {valid.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/60"}`} />
              ))}
            </div>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Expand image"
          className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-ds-text-primary shadow hover:bg-white"
        >
          <Expand className="h-4 w-4" />
        </button>
      </div>
      {count > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product images">
          {valid.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`View image ${i + 1} of ${count}`}
              onClick={() => setIndex(i)}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-ds-sm border-2 transition ${i === index ? "border-ds-brand-primary" : "border-ds-border-base hover:border-ds-border-strong"}`}
            >
              <Image src={src} alt={`${alt} ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <div className="relative h-full max-h-[90vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image src={current} alt={alt} fill className="object-contain" />
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="absolute right-2 top-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-ds-text-primary"
            >
              Close
            </button>
            {count > 1 ? (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2"
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
