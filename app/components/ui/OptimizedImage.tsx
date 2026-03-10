import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface OptimizedImageProps extends Omit<ImageProps, "src"> {
  src: string;
  fallbackSrc?: string;
}

/**
 * OptimizedImage Component
 *
 * Wraps Next.js Image component with MyHarvestHub-specific defaults:
 * - Automatic placeholder blur
 * - Fallback image on error
 * - Optimized loading strategy
 * - Purple theme loading indicator
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/products/item.jpg"
 *   alt="Product Image"
 *   width={400}
 *   height={400}
 * />
 * ```
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = "/images/placeholder.png",
  className = "",
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative ${className}`}>
      <Image
        {...props}
        src={imgSrc}
        alt={alt}
        className={` transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"} ${className} `}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(fallbackSrc);
          setIsLoading(false);
        }}
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2UyZThmMCIvPjwvc3ZnPg=="
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-ds-surface-sunken animate-pulse">
          <div className="w-8 h-8 border-4 border-ds-brand-muted border-t-ds-brand-primary rounded-ds-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export default OptimizedImage;
