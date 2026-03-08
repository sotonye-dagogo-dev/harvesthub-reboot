import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Badge({ children, variant = "default", size = "md", className }: BadgeProps) {
  const variants = {
    default: "bg-ds-surface-sunken text-ds-text-secondary",
    primary: "bg-ds-brand-subtle text-ds-text-brand",
    success: "bg-ds-status-success-bg text-ds-status-success-text",
    warning: "bg-ds-status-warning-bg text-ds-status-warning-text",
    danger: "bg-ds-status-error-bg text-ds-status-error-text",
    info: "bg-ds-status-info-bg text-ds-status-info-text",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
