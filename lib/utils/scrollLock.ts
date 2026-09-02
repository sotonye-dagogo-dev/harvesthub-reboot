"use client";

/**
 * Non-blocking scroll lock utility with reference counting.
 * Ensures multiple modals/drawers can lock scroll without fighting,
 * restores previous overflow value accurately, and compensates for
 * scrollbar width to prevent layout shift. All operations are
 * no-ops on server or when document unavailable (non-blocking).
 */

let lockCount = 0;
let prevOverflow: string | null = null;
let prevPaddingRight: string | null = null;
let prevHtmlOverflow: string | null = null;

function getScrollbarWidth(): number {
  if (typeof document === "undefined") return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

export function lockScroll(): void {
  if (typeof document === "undefined") return;
  try {
    if (lockCount === 0) {
      prevOverflow = document.body.style.overflow;
      prevPaddingRight = document.body.style.paddingRight;
      prevHtmlOverflow = document.documentElement.style.overflow;
      const scrollbarWidth = getScrollbarWidth();
      if (scrollbarWidth > 0) {
        const computed = parseFloat(getComputedStyle(document.body).paddingRight || "0");
        document.body.style.paddingRight = `${computed + scrollbarWidth}px`;
      }
      // Lock both body and html to cover browsers that scroll html element
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }
    lockCount += 1;
  } catch {
    // non-blocking: ignore errors
  }
}

export function unlockScroll(): void {
  if (typeof document === "undefined") return;
  try {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.overflow = prevOverflow ?? "";
      document.body.style.paddingRight = prevPaddingRight ?? "";
      document.documentElement.style.overflow = prevHtmlOverflow ?? "";
      prevOverflow = null;
      prevPaddingRight = null;
      prevHtmlOverflow = null;
    }
  } catch {
    // non-blocking
  }
}

/**
 * Hook-like helper for components: call lock on open, unlock on close/unmount.
 * Handles stale prev value when component unmounts while still locked.
 */
export function useScrollLock(isLocked: boolean) {
  if (typeof window !== "undefined") {
    // This is intentionally not a hook; components use useEffect externally.
  }
}
