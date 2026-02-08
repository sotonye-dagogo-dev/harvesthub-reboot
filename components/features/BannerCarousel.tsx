"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BannerItem {
  id: string;
  title: string;
  image: string;
  link?: string;
  description?: string;
}

export interface BannerCarouselProps {
  banners: BannerItem[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

export function BannerCarousel({
  banners,
  autoPlay = true,
  interval = 5000,
  className,
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, banners.length, interval]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  if (!currentBanner) return null;

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {/* Banner Content */}
      <div className="relative aspect-[5/1] md:aspect-[8/1]">
        {currentBanner.link ? (
          <Link href={currentBanner.link}>
            <Image
              src={currentBanner.image}
              alt={currentBanner.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            {currentBanner.description && (
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-6">
                <div className="text-white">
                  <h2 className="mb-2 text-2xl font-bold md:text-4xl">{currentBanner.title}</h2>
                  <p className="text-sm md:text-base">{currentBanner.description}</p>
                </div>
              </div>
            )}
          </Link>
        ) : (
          <>
            <Image
              src={currentBanner.image}
              alt={currentBanner.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            {currentBanner.description && (
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-6">
                <div className="text-white">
                  <h2 className="mb-2 text-2xl font-bold md:text-4xl">{currentBanner.title}</h2>
                  <p className="text-sm md:text-base">{currentBanner.description}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-900 shadow-lg transition-all hover:bg-white dark:bg-gray-900/90 dark:text-white dark:hover:bg-gray-900"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-900 shadow-lg transition-all hover:bg-white dark:bg-gray-900/90 dark:text-white dark:hover:bg-gray-900"
            aria-label="Next banner"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentIndex ? "w-8 bg-white" : "w-2 bg-white/60 hover:bg-white/80"
              )}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
