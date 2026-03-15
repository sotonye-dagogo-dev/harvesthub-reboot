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

  const isDark = mode !== "light";

  if (variant === "button") {
    return (
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        aria-pressed={isDark}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={cn(
          "inline-flex items-center gap-2 rounded-ds-md border border-ds-border-base bg-ds-surface-base px-4 py-2 text-sm font-medium text-ds-text-secondary transition-colors hover:bg-ds-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500",
          className
        )}
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
      aria-label="Toggle theme"
      aria-pressed={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "rounded-ds-full p-3 sm:p-2 text-ds-text-secondary transition-colors hover:bg-ds-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500",
        className
      )}
    >
      {mode === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}
