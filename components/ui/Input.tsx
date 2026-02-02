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
      "block w-full rounded-lg border bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors",
      "focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20",
      "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500",
      "dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:placeholder-gray-500",
      "dark:focus:border-purple-400 dark:focus:ring-purple-400/20",
      "dark:disabled:bg-gray-900 dark:disabled:text-gray-600",
      error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-gray-300",
      prefix && "pl-12",
      suffix && "pr-12",
      className
    );

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <div className="relative">
          {prefix && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <span className="text-gray-500 dark:text-gray-400">{prefix}</span>
            </div>
          )}

          <input ref={ref} className={inputClasses} {...props} />

          {suffix && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <span className="text-gray-500 dark:text-gray-400">{suffix}</span>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {hint && !error && <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
