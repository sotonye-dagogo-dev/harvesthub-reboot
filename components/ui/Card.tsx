import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
  bordered?: boolean;
}

export function Card({
  children,
  className,
  padding = "md",
  hoverable = false,
  bordered = true,
}: CardProps) {
  const paddingClasses = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "rounded-ds-md bg-ds-surface-base",
        bordered && "border border-ds-border-base",
        paddingClasses[padding],
        hoverable && "transition-shadow hover:shadow-ds-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between", className)}>
      <div>
        <h3 className="text-lg font-semibold text-ds-text-primary">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-ds-text-secondary">{subtitle}</p>}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}

export interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("mt-4", className)}>{children}</div>;
}

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return <div className={cn("mt-6 flex items-center gap-3", className)}>{children}</div>;
}
