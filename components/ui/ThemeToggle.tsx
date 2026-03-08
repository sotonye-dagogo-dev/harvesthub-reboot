"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/providers";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "button";
}

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { mode, toggleTheme } = useTheme();

  if (variant === "button") {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "inline-flex items-center gap-2 rounded-ds-md border border-ds-border-base bg-ds-surface-base px-4 py-2 text-sm font-medium text-ds-text-secondary transition-colors hover:bg-ds-surface-sunken",
          className
        )}
        aria-label="Toggle theme"
      >
        {mode === "light" ? (
          <>
            <Moon className="h-4 w-4" />
            <span>Dark Mode</span>
          </>
        ) : (
          <>
            <Sun className="h-4 w-4" />
            <span>Light Mode</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "rounded-ds-full p-2 text-ds-text-secondary transition-colors hover:bg-ds-surface-sunken",
        className
      )}
      aria-label="Toggle theme"
    >
      {mode === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}
