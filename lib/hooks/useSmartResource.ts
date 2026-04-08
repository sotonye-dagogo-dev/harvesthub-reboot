import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CacheEntry<T> = {
    data: T;
    updatedAt: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

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
    areEqual?: (prev: T | undefined, next: T) => boolean;
    onError?: (error: unknown) => void;
}

export interface SmartResourceState<T> {
    data: T | undefined;
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
    lastUpdatedAt: number | null;
    refresh: (force?: boolean) => Promise<void>;
    mutate: (next: T | ((prev: T | undefined) => T), persist?: boolean) => void;
}

export function useSmartResource<T>(
    fetcher: () => Promise<T>,
    {
        key,
        enabled = true,
        refreshIntervalMs = 0,
        staleTimeMs = 30_000,
        areEqual = defaultAreEqual,
        onError,
    }: UseSmartResourceOptions<T>
): SmartResourceState<T> {
    const cacheSnapshot = useMemo(() => {
        const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
        return entry;
    }, [key]);

    const [data, setData] = useState<T | undefined>(() => cacheSnapshot?.data);
    const [isLoading, setIsLoading] = useState<boolean>(() => enabled && !cacheSnapshot?.data);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(() => cacheSnapshot?.updatedAt ?? null);

    const dataRef = useRef<T | undefined>(cacheSnapshot?.data);
    const refreshingRef = useRef(false);

    const applyData = useCallback(
        (nextData: T, persist = true) => {
            const previous = dataRef.current;
            if (!areEqual(previous, nextData)) {
                dataRef.current = nextData;
                setData(nextData);
            }

            const updatedAt = Date.now();
            setLastUpdatedAt(updatedAt);

            if (persist) {
                memoryCache.set(key, {
                    data: nextData,
                    updatedAt,
                });
            }
        },
        [areEqual, key]
    );

    const refresh = useCallback(
        async (force = false) => {
            if (!enabled || refreshingRef.current) return;

            const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
            const isStale = !cached || Date.now() - cached.updatedAt > staleTimeMs;
            if (!force && !isStale) return;

            refreshingRef.current = true;
            setError(null);

            if (!dataRef.current) {
                setIsLoading(true);
            } else {
                setIsRefreshing(true);
            }

            try {
                const nextData = await fetcher();
                applyData(nextData);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to load data";
                setError(message);
                onError?.(err);
            } finally {
                refreshingRef.current = false;
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        [enabled, key, staleTimeMs, fetcher, applyData, onError]
    );

    const mutate = useCallback(
        (next: T | ((prev: T | undefined) => T), persist = true) => {
            const resolved = typeof next === "function" ? (next as (prev: T | undefined) => T)(dataRef.current) : next;
            applyData(resolved, persist);
        },
        [applyData]
    );

    useEffect(() => {
        const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
        if (cached) {
            dataRef.current = cached.data;
            setData(cached.data);
            setLastUpdatedAt(cached.updatedAt);
            setIsLoading(false);
        } else {
            dataRef.current = undefined;
            setData(undefined);
            setLastUpdatedAt(null);
            setIsLoading(enabled);
        }
        setError(null);

        if (enabled) {
            void refresh();
        }
    }, [enabled, key, refresh]);

    useEffect(() => {
        if (!enabled || refreshIntervalMs <= 0) return;

        const interval = window.setInterval(() => {
            void refresh(true);
        }, refreshIntervalMs);

        return () => window.clearInterval(interval);
    }, [enabled, refresh, refreshIntervalMs]);

    return {
        data,
        isLoading,
        isRefreshing,
        error,
        lastUpdatedAt,
        refresh,
        mutate,
    };
}

export function clearSmartResourceCache(key?: string) {
    if (key) {
        memoryCache.delete(key);
        return;
    }
    memoryCache.clear();
}
