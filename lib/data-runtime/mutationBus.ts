"use client";

import { useEffect } from "react";

const DATA_MUTATED_EVENT = "myharvesthub:data-mutated";

export type MutationKey =
  | "products"
  | "banners"
  | "vendor-content"
  | "vendors"
  | "orders"
  | "vouchers"
  | "marketing-content"
  | "blog"
  | "public-content"
  | "users"
  | "ads"
  | "settings"
  | "operations-dashboard"
  | "analytics";

type MutationHandler = (keys: string[]) => void;

export function emitDataMutated(keys: string[]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DATA_MUTATED_EVENT, { detail: { keys } }));
}

export function subscribeDataMutated(handler: MutationHandler): () => void {
  if (typeof window === "undefined") return () => {};

  const listener = (event: Event) => {
    const detail = (event as CustomEvent<{ keys?: string[] }>).detail;
    handler(detail?.keys ?? []);
  };

  window.addEventListener(DATA_MUTATED_EVENT, listener);
  return () => window.removeEventListener(DATA_MUTATED_EVENT, listener);
}

/**
 * Re-runs `onMutated` whenever any of `keys` are reported mutated by
 * `emitDataMutated`. Works alongside the runtime resource cache so pages
 * can refresh themselves without manual reload/navigation.
 */
export function useDataMutationInvalidation(keys: string[], onMutated: () => void) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const unsubscribe = subscribeDataMutated((mutatedKeys) => {
      if (mutatedKeys.some((key) => keys.includes(key))) onMutated();
    });

    return unsubscribe;
  }, [keys, onMutated]);
}