"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRuntimeStore, updateRuntimeResourceData } from "@/lib/data-runtime/runtimeStore";
import { ensureRuntimeDefinition, loadRuntimeResource } from "@/lib/data-runtime/runtimeClient";
import { useDataMutationInvalidation } from "@/lib/data-runtime/mutationBus";
import type {
  RuntimeFetchContext,
  RuntimePolicyOverride,
  RuntimeResourceDefinition,
  RuntimeResourceScope,
} from "@/lib/data-runtime/contracts";

type UseRuntimeResourceOptions<TData, TParams = unknown> = {
  key: string;
  fetcher: (context: RuntimeFetchContext<TParams>) => Promise<TData>;
  enabled?: boolean;
  refreshIntervalMs?: number;
  staleTimeMs?: number;
  ttlMs?: number;
  spinnerThresholdMs?: number;
  silentRefresh?: boolean;
  compareStrategy?: RuntimePolicyOverride<TData>["compareStrategy"];
  retry?: RuntimePolicyOverride<TData>["retry"];
  scope?: RuntimeResourceScope;
  tags?: string[];
  invalidateOn?: string[];
  onError?: (error: unknown) => void;
};

export type RuntimeResourceHookState<TData> = {
  data: TData | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdatedAt: number | null;
  refresh: (force?: boolean) => Promise<void>;
  mutate: (next: TData | ((previous: TData | undefined) => TData)) => void;
};

export function useRuntimeResource<TData, TParams = unknown>({
  key,
  fetcher,
  enabled = true,
  refreshIntervalMs = 0,
  staleTimeMs,
  ttlMs,
  spinnerThresholdMs,
  silentRefresh,
  compareStrategy,
  retry,
  scope = { visibility: "public" },
  tags,
  invalidateOn,
  onError,
}: UseRuntimeResourceOptions<TData, TParams>): RuntimeResourceHookState<TData> {
  const resource = useRuntimeStore((state) => state.resources[key]);

  const policyOverride = useMemo<RuntimePolicyOverride<TData>>(
    () => ({
      staleTimeMs,
      ttlMs,
      spinnerThresholdMs,
      silentRefresh,
      compareStrategy,
      retry,
    }),
    [compareStrategy, retry, silentRefresh, spinnerThresholdMs, staleTimeMs, ttlMs]
  );

  useEffect(() => {
    const definition: RuntimeResourceDefinition<TData, TParams> = {
      key,
      fetcher,
      scope,
      policy: policyOverride,
      tags,
    };

    ensureRuntimeDefinition(definition);
  }, [fetcher, key, policyOverride, scope, tags]);

  const refresh = useCallback(
    async (force = false) => {
      if (!enabled) return;
      try {
        await loadRuntimeResource<TData, TParams>(key, { force });
      } catch (error) {
        onError?.(error);
      }
    },
    [enabled, key, onError]
  );

  const mutate = useCallback(
    (next: TData | ((previous: TData | undefined) => TData)) => {
      updateRuntimeResourceData<TData>(key, (previous) =>
        typeof next === "function" ? (next as (previous: TData | undefined) => TData)(previous) : next
      );
    },
    [key]
  );

  useEffect(() => {
    if (!enabled) return;

    void refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled || refreshIntervalMs <= 0) return;

    const interval = window.setInterval(() => {
      void loadRuntimeResource<TData, TParams>(key, {
        force: true,
        background: true,
      });
    }, refreshIntervalMs);

    return () => window.clearInterval(interval);
  }, [enabled, key, refreshIntervalMs]);

  useDataMutationInvalidation(
    enabled && invalidateOn ? invalidateOn : [],
    () => {
      void loadRuntimeResource<TData, TParams>(key, { force: true, background: true });
    }
  );

  const hasAnyData =
    typeof resource?.data !== "undefined" || typeof resource?.lastGoodData !== "undefined";
  const isInitialLoading = enabled && !hasAnyData && !resource;
  const isRefreshingState =
    resource?.status === "refreshing" || (Boolean(resource?.inFlight) && hasAnyData);

  return {
    data: resource?.data as TData | undefined,
    isLoading: isInitialLoading || resource?.status === "loading",
    isRefreshing: isRefreshingState,
    error: resource?.error ?? null,
    lastUpdatedAt: resource?.updatedAt ?? null,
    refresh,
    mutate,
  };
}
