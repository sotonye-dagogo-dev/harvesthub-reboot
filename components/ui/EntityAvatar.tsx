"use client";

import { ReactNode, useMemo, useState } from "react";
import Image from "next/image";
import { Store, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface EntityAvatarProps {
  src?: string | null;
  alt: string;
  label?: string;
  className?: string;
  fallbackClassName?: string;
  fallbackIcon?: ReactNode;
  shape?: "circle" | "rounded";
}

export function EntityAvatar({
  src,
  alt,
  label,
  className,
  fallbackClassName,
  fallbackIcon,
  shape = "circle",
}: EntityAvatarProps) {
  const normalizedSrc = typeof src === "string" ? src.trim() : "";
  const [failed, setFailed] = useState(false);

  const showImage = normalizedSrc.length > 0 && !failed;
  const initial = useMemo(() => {
    const base = (label || alt || "").trim();
    return base.length > 0 ? base.charAt(0).toUpperCase() : "";
  }, [alt, label]);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-ds-surface-sunken",
        shape === "circle" ? "rounded-ds-full" : "rounded-ds-md",
        className
      )}
      aria-label={alt}
    >
      {showImage ? (
        <Image
          src={normalizedSrc}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setFailed(true)}
          sizes="64px"
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center text-ds-text-placeholder",
            fallbackClassName
          )}
        >
          {fallbackIcon ||
            (initial ? (
              <span className="text-sm font-semibold text-ds-text-secondary">{initial}</span>
            ) : (
              <User className="h-4 w-4" />
            ))}
        </div>
      )}
    </div>
  );
}

export function VendorAvatar({
  src,
  alt,
  label,
  className,
}: Omit<EntityAvatarProps, "fallbackIcon">) {
  return (
    <EntityAvatar
      src={src}
      alt={alt}
      label={label}
      className={className}
      fallbackIcon={<Store className="h-4 w-4 text-ds-text-secondary" />}
    />
  );
}
