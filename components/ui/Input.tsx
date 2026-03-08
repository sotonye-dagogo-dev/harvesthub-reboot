import { InputHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, fullWidth = false, className, ...props }, ref) => {
    const inputClasses = cn(
      "block w-full rounded-ds-md border bg-ds-surface-base px-4 py-2.5 text-ds-text-primary placeholder-ds-text-placeholder transition-colors",
      "focus:border-ds-border-focus focus:outline-none focus:ring-2 focus:ring-ds-focus-ring/20",
      "disabled:cursor-not-allowed disabled:bg-ds-surface-disabled disabled:text-ds-text-disabled",
      error
        ? "border-ds-status-error focus:border-ds-status-error focus:ring-ds-status-error/20"
        : "border-ds-border-base",
      prefix && "pl-12",
      suffix && "pr-12",
      className
    );

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label className="text-sm font-medium text-ds-text-secondary">
            {label}
            {props.required && <span className="ml-1 text-ds-status-error">*</span>}
          </label>
        )}

        <div className="relative">
          {prefix && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <span className="text-ds-text-tertiary">{prefix}</span>
            </div>
          )}

          <input ref={ref} className={inputClasses} {...props} />

          {suffix && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <span className="text-ds-text-tertiary">{suffix}</span>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-ds-status-error-text">{error}</p>}
        {hint && !error && <p className="text-sm text-ds-text-tertiary">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
