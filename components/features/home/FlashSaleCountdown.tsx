"use client";

import { useEffect, useState } from "react";

function msUntilEndOfDay(now: Date): number {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return Math.max(0, end.getTime() - now.getTime());
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/**
 * Countdown to local midnight for the daily Flash Sales rail.
 * Renders a stable placeholder until mounted to avoid hydration mismatches.
 */
export function FlashSaleCountdown({ className }: { className?: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(msUntilEndOfDay(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const totalSeconds = remaining === null ? null : Math.floor(remaining / 1000);
  const label =
    totalSeconds === null
      ? "--h : --m : --s"
      : `${pad(Math.floor(totalSeconds / 3600))}h : ${pad(Math.floor((totalSeconds % 3600) / 60))}m : ${pad(totalSeconds % 60)}s`;

  return (
    <span className={className} aria-live="off">
      <span className="hidden sm:inline">Time left: </span>
      <span className="font-bold tabular-nums">{label}</span>
    </span>
  );
}
