"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { mockBanners } from "@/lib/data/mockData";

export function TopAdBanner() {
  const [banner, setBanner] = useState<(typeof mockBanners)[0] | null>(null);

  useEffect(() => {
    // Get the first active banner for top display
    const activeBanner = mockBanners.find((b) => b.isActive && b.position === "TOP");
    if (activeBanner) {
      setBanner(activeBanner);
    }
  }, []);

  if (!banner) return null;

  const content = (
    <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2.5 text-white">
      {banner.imageUrl && (
        <div className="relative h-8 w-8 flex-shrink-0">
          <Image src={banner.imageUrl} alt={banner.title} fill className="rounded object-cover" />
        </div>
      )}
      <div className="flex-1 text-center">
        <p className="text-sm font-medium">{banner.title}</p>
        {banner.description && <p className="text-xs text-purple-100">{banner.description}</p>}
      </div>
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
