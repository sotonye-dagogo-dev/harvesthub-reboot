"use client";

import { useRuntimeResource, type RuntimeResourceHookState } from "@/lib/hooks/useRuntimeResource";
import { useRuntimeStore } from "@/lib/data-runtime/runtimeStore";

function defaultAreEqual<T>(prev: T | undefined, next: T): boolean {
  if (typeof prev === "undefined") return false;
  if (Object.is(prev, next)) return true;

  try {
    return JSON.stringify(prev) === JSON.stringify(next);
  } catch {
    return false;
  }
}

export interface UseSmartResourceOptions<T> {
  key: string;
  enabled?: boolean;
  refreshIntervalMs?: number;
  staleTimeMs?: number;
  invalidateOn?: string[];
  areEqual?: (prev: T | undefined, next: T) => boolean;
  onError?: (error: unknown) => void;
}

export type SmartResourceState<T> = RuntimeResourceHookState<T>;

export function useSmartResource<T>(
  fetcher: () => Promise<T>,
  {
    key,
    enabled = true,
    refreshIntervalMs = 0,
    staleTimeMs = 30_000,
    invalidateOn,
    areEqual = defaultAreEqual,
    onError,
  }: UseSmartResourceOptions<T>
): SmartResourceState<T> {
  return useRuntimeResource<T>({
    key,
    enabled,
    refreshIntervalMs,
    staleTimeMs,
    invalidateOn,
    compareStrategy: areEqual,
    onError,
    scope: { visibility: "public" },
    fetcher: async () => fetcher(),
  });
}

export function clearSmartResourceCache(key?: string) {
  const { clearAll, removeResource } = useRuntimeStore.getState();
  if (key) {
    removeResource(key);
    return;
  }
  clearAll();
}
