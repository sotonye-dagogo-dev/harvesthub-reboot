import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type HomeSectionTone = "plain" | "deep" | "magenta";

interface HomeSectionProps {
  title: ReactNode;
  href?: string;
  linkLabel?: string;
  /** Header bar colour: plain (white), deep (Harvesters Purple) or magenta (Flash Sales). */
  tone?: HomeSectionTone;
  /** Extra content shown in the header bar (e.g. a countdown). */
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
}

const TONE_HEADER: Record<HomeSectionTone, string> = {
  plain: "bg-ds-surface-base text-ds-text-primary border-b border-ds-border-subtle dark:bg-ds-surface-raised",
  deep: "bg-ds-brand-deep text-ds-brand-on-deep",
  magenta: "bg-ds-brand-primary text-white",
};

const TONE_LINK: Record<HomeSectionTone, string> = {
  plain: "text-ds-text-brand hover:text-ds-brand-primary",
  deep: "text-ds-brand-on-deep hover:text-ds-palette-magenta-200",
  magenta: "text-white hover:text-ds-palette-magenta-100",
};

/** Jumia-style home section: a coloured header bar with "See all", over a white card body. */
export function HomeSection({
  title,
  href,
  linkLabel = "See all",
  tone = "plain",
  headerExtra,
  children,
  className,
}: HomeSectionProps) {
  return (
    <section className={cn("mb-4 overflow-hidden rounded-ds-md bg-ds-surface-base shadow-ds-sm dark:bg-ds-surface-raised", className)}>
      <div className={cn("flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4", TONE_HEADER[tone])}>
        <h2 className="flex min-w-0 items-center gap-2 truncate text-base font-semibold text-inherit sm:text-lg">
          {title}
        </h2>
        <div className="flex flex-shrink-0 items-center gap-4 text-xs sm:text-sm">
          {headerExtra}
          {href ? (
            <Link href={href} className={cn("inline-flex items-center gap-0.5 font-semibold uppercase", TONE_LINK[tone])}>
              {linkLabel}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
      <div className="p-2 sm:p-3">{children}</div>
    </section>
  );
}
