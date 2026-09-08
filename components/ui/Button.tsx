import { ReactNode, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-ds-brand-primary text-ds-text-inverse hover:bg-ds-brand-primary-hover focus:ring-ds-focus-ring",
    secondary:
      "border border-ds-border-base bg-ds-surface-base text-ds-text-primary hover:bg-ds-surface-sunken focus:ring-ds-focus-ring",
    outline:
      "border-2 border-ds-border-brand text-ds-text-brand hover:bg-ds-brand-surface focus:ring-ds-focus-ring",
    ghost: "text-ds-text-brand hover:bg-ds-brand-surface focus:ring-ds-focus-ring",
    danger:
      "bg-ds-status-error text-ds-text-inverse hover:bg-ds-status-error-text focus:ring-ds-status-error",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-base gap-2",
    lg: "px-6 py-3 text-lg gap-2.5",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], fullWidth && "w-full", className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
