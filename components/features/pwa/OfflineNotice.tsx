"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

type NoticeState = "hidden" | "offline-collapsed" | "offline-expanded" | "back-online";

const SESSION_KEY = "harvesthub-last-data-timestamp";

function getLastDataTimestamp(): string {
  if (typeof sessionStorage === "undefined") return "";
  return sessionStorage.getItem(SESSION_KEY) || "";
}

function setLastDataTimestamp(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, new Date().toLocaleString());
}

export default function OfflineNotice() {
  const [state, setState] = useState<NoticeState>("hidden");
  const [dismissed, setDismissed] = useState(false);
  const [lastTimestamp, setLastTimestamp] = useState("");
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOffline = useCallback(() => {
    setLastTimestamp(getLastDataTimestamp());
    setDismissed(false);
    setState("offline-collapsed");
  }, []);

  const handleOnline = useCallback(() => {
    setLastDataTimestamp();
    setState("back-online");

    dismissTimerRef.current = setTimeout(() => {
      setState("hidden");
    }, 4000);
  }, []);

  useEffect(() => {
    // Set initial timestamp when online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      setLastDataTimestamp();
    }

    // Check initial state
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      handleOffline();
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [handleOffline, handleOnline]);

  // Reappear on navigation if still offline
  useEffect(() => {
    const handleNavigation = () => {
      if (typeof navigator !== "undefined" && !navigator.onLine && dismissed) {
        setDismissed(false);
        setState("offline-collapsed");
      }
    };

    window.addEventListener("popstate", handleNavigation);
    return () => window.removeEventListener("popstate", handleNavigation);
  }, [dismissed]);

  if (state === "hidden" || (dismissed && state !== "back-online")) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2" role="status" aria-live="polite">
      {/* Back online toast */}
      {state === "back-online" && (
        <div className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg animate-in slide-in-from-bottom-4">
          <span className="inline-block h-2 w-2 rounded-full bg-green-300" />
          You&apos;re back online!
        </div>
      )}

      {/* Offline collapsed pill */}
      {state === "offline-collapsed" && (
        <button
          onClick={() => setState("offline-expanded")}
          className="flex items-center gap-2 rounded-full bg-purple-700 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:bg-purple-600"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          You&apos;re offline
        </button>
      )}

      {/* Offline expanded card */}
      {state === "offline-expanded" && (
        <div className="w-[min(360px,90vw)] rounded-xl bg-purple-800 p-4 text-white shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm font-semibold">You&apos;re currently offline</span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="rounded-full p-1 text-purple-300 transition-colors hover:bg-purple-700 hover:text-white"
              aria-label="Dismiss offline notice"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="text-xs leading-relaxed text-purple-200">
            The data being displayed was last updated
            {lastTimestamp ? ` at ${lastTimestamp}` : " recently"}.
            Some actions require an internet connection.
          </p>
          <button
            onClick={() => setState("offline-collapsed")}
            className="mt-3 w-full rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-500"
          >
            Collapse
          </button>
        </div>
      )}
    </div>
  );
}
