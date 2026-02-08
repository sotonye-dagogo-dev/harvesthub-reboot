"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { mockBanners } from "@/lib/data/mockData";

export function TopAdBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [banner, setBanner] = useState<(typeof mockBanners)[0] | null>(null);

  useEffect(() => {
    // Get the first active banner for top display
    const activeBanner = mockBanners.find((b) => b.isActive);
    if (activeBanner) {
      setBanner(activeBanner);
    }
  }, []);

  if (!isVisible || !banner) return null;

  const content = (
    <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2 text-white">
      {banner.imageUrl && (
        <div className="relative h-8 w-8 flex-shrink-0">
          <Image src={banner.imageUrl} alt={banner.title} fill className="rounded object-cover" />
        </div>
      )}
      <div className="flex-1 text-center">
        <p className="text-sm font-medium">{banner.title}</p>
        {banner.description && <p className="text-xs text-purple-100">{banner.description}</p>}
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(false);
        }}
        className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-purple-800"
        aria-label="Close banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  if (banner.linkUrl) {
    return (
      <Link href={banner.linkUrl} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
