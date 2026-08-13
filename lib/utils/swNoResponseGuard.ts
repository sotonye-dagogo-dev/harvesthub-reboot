"use client";

import { useEffect } from "react";

/**
 * The Serwist/Workbox service worker surfaces an `Uncaught (in promise)
 * no-response` rejection when navigation preload for a document request
 * fails (e.g. transient network errors during route navigations). The
 * worker already falls back to the cached page or `/offline.html`, so the
 * rejection is non-fatal and only produces console noise.
 *
 * This guard silently swallows those `no-response` rejections so they no
 * longer surface as uncaught errors while all real failures keep bubbling.
 */

function isNoResponseReason(reason: unknown): boolean {
  if (!reason || typeof reason !== "object") return false;
  const candidate = reason as { name?: unknown; code?: unknown; message?: unknown };
  const name = typeof candidate.name === "string" ? candidate.name : "";
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const message = typeof candidate.message === "string" ? candidate.message : "";
  return name === "no-response" || code === "no-response" || /^no-response/.test(message);
}

export function SwNoResponseGuard(): null {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      if (isNoResponseReason(event.reason)) {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return null;
}