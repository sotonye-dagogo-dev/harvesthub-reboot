"use client";

import { useCallback, useEffect, useState } from "react";
import {
  OPTION_LIST_FALLBACKS,
  visibleOptions,
  type OptionListKey,
  type OptionRow,
} from "@/lib/config/optionLists";

export type OptionListState = {
  /** Every row (including hidden). Starts as the code fallback. */
  options: OptionRow[];
  /** Rows a picker should offer. */
  visible: OptionRow[];
  loading: boolean;
  /** True while showing code fallbacks (no usable server payload yet). */
  fallback: boolean;
  error: string | null;
  refresh: () => void;
};

type CacheEntry = { options: OptionRow[]; fallback: boolean; expires: number };

const CACHE_TTL_MS = 60_000;
const moduleCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CacheEntry>>();

async function loadList(key: OptionListKey): Promise<CacheEntry> {
  const cached = moduleCache.get(key);
  if (cached && cached.expires > Date.now()) return cached;

  const pending = inflight.get(key);
  if (pending) return pending;

  const request = fetch(`/api/config/option-lists/${key}`, { headers: { Accept: "application/json" } })
    .then(async (response) => {
      if (!response.ok) throw new Error(`OPTION_LIST_HTTP_${response.status}`);
      const payload = (await response.json()) as {
        success?: boolean;
        options?: OptionRow[];
        fallback?: boolean;
      };
      if (!payload?.success || !Array.isArray(payload.options)) {
        throw new Error("OPTION_LIST_BAD_PAYLOAD");
      }
      const entry: CacheEntry = {
        options: payload.options,
        fallback: payload.fallback === true,
        expires: Date.now() + CACHE_TTL_MS,
      };
      moduleCache.set(key, entry);
      return entry;
    })
    .catch(() => {
      // Network / server failure → keep the code fallback for this read.
      const entry: CacheEntry = {
        options: [...OPTION_LIST_FALLBACKS[key]],
        fallback: true,
        expires: Date.now() + 15_000,
      };
      return entry;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
}

/**
 * Load an option list for a picker.
 *
 * Never throws and never renders an empty list because of a transport failure:
 * it always starts from the code fallback and upgrades to the server payload.
 */
export function useOptionList(key: OptionListKey, options?: { enabled?: boolean }): OptionListState {
  const enabled = options?.enabled ?? true;
  const cached = moduleCache.get(key);

  const [state, setState] = useState<{
    options: OptionRow[];
    fallback: boolean;
    loading: boolean;
    error: string | null;
  }>(() => ({
    options: cached?.options ?? [...OPTION_LIST_FALLBACKS[key]],
    fallback: cached?.fallback ?? true,
    loading: enabled && !cached,
    error: null,
  }));

  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    let active = true;
    setState((prev) => ({ ...prev, loading: true }));

    void loadList(key).then((entry) => {
      if (!active) return;
      setState({
        options: entry.options,
        fallback: entry.fallback,
        loading: false,
        error: null,
      });
    });

    return () => {
      active = false;
    };
  }, [key, enabled, reloadToken]);

  const refresh = useCallback(() => {
    moduleCache.delete(key);
    setReloadToken((token) => token + 1);
  }, [key]);

  return {
    options: state.options,
    visible: visibleOptions(state.options),
    loading: state.loading,
    fallback: state.fallback,
    error: state.error,
    refresh,
  };
}
