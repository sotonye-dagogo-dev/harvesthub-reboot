"use client";

import { useEffect, useRef } from "react";

interface AutoScrollRailOptions {
  enabled: boolean;
  direction: "horizontal" | "vertical";
  stepPx: number;
  intervalMs: number;
  pauseAfterInteractionMs: number;
}

export function useAutoScrollRail(options: AutoScrollRailOptions) {
  const { enabled, direction, stepPx, intervalMs, pauseAfterInteractionMs } = options;
  const railRef = useRef<HTMLDivElement | null>(null);
  const pausedUntilRef = useRef(0);
  const interactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pause = () => {
    pausedUntilRef.current = Date.now() + pauseAfterInteractionMs;
  };

  const resumeSoon = () => {
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
    interactionTimerRef.current = setTimeout(() => {
      pausedUntilRef.current = 0;
    }, pauseAfterInteractionMs);
  };

  useEffect(() => {
    if (!enabled) return;
    const rail = railRef.current;
    if (!rail) return;

    const timer = setInterval(() => {
      if (Date.now() < pausedUntilRef.current) return;

      const isHorizontal = direction === "horizontal";
      const maxOffset = isHorizontal
        ? rail.scrollWidth - rail.clientWidth
        : rail.scrollHeight - rail.clientHeight;

      if (maxOffset <= 0) return;

      const currentOffset = isHorizontal ? rail.scrollLeft : rail.scrollTop;
      const nextOffset = currentOffset + stepPx;
      const reachedEnd = nextOffset >= maxOffset - 2;
      const target = reachedEnd ? 0 : nextOffset;

      rail.scrollTo(
        isHorizontal
          ? { left: target, behavior: "smooth" }
          : { top: target, behavior: "smooth" }
      );
    }, intervalMs);

    return () => {
      clearInterval(timer);
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current);
      }
    };
  }, [direction, enabled, intervalMs, pauseAfterInteractionMs, stepPx]);

  return {
    railRef,
    bind: {
      onMouseEnter: pause,
      onMouseLeave: resumeSoon,
      onFocusCapture: pause,
      onBlurCapture: resumeSoon,
      onPointerDown: pause,
      onPointerUp: resumeSoon,
      onTouchStart: pause,
      onTouchMove: pause,
      onTouchEnd: resumeSoon,
      onWheel: pause,
    },
  };
}
