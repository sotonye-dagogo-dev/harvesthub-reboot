import { getRuntimeResourcePolicy, getRuntimeResourceDefinition, registerRuntimeResource } from "@/lib/data-runtime/resourceRegistry";
import { getRuntimeResourceState, useRuntimeStore } from "@/lib/data-runtime/runtimeStore";
import { reconcileResourceData } from "@/lib/data-runtime/reconciler";
import { recordRuntimeTelemetry } from "@/lib/data-runtime/telemetry";
import type {
  RuntimeLoadOptions,
  RuntimeResourceDefinition,
  RuntimeResourcePolicy,
} from "@/lib/data-runtime/contracts";

function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("connection closed") ||
    message.includes("server has closed") ||
    message.includes("econnreset") ||
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout")
  );
}

function computeBackoffDelay<TData>(policy: RuntimeResourcePolicy<TData>, attempt: number): number {
  const exp = Math.min(policy.retry.maxDelayMs, policy.retry.baseDelayMs * 2 ** (attempt - 1));
  const jitter = exp * policy.retry.jitterRatio * Math.random();
  return Math.round(exp + jitter);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function ensureRuntimeDefinition<TData, TParams = unknown>(
  definition: RuntimeResourceDefinition<TData, TParams>
): void {
  registerRuntimeResource(definition);
}

export async function loadRuntimeResource<TData, TParams = unknown>(
  key: string,
  options?: RuntimeLoadOptions<TParams>
): Promise<TData | undefined> {
  const definition = getRuntimeResourceDefinition<TData, TParams>(key);
  if (!definition) {
    throw new Error(`Runtime resource not registered: ${key}`);
  }

  const state = getRuntimeResourceState<TData>(key);
  if (state.inFlight) {
    return state.data;
  }

  const policy = getRuntimeResourcePolicy<TData>(key);
  const now = Date.now();
  const stale = !state.updatedAt || now - state.updatedAt > policy.staleTimeMs;
  if (!options?.force && !stale) {
    return state.data;
  }

  if (!options?.force && state.cooldownUntil && now < state.cooldownUntil) {
    return state.data;
  }

  const isBackground = Boolean(options?.background || (state.data && policy.silentRefresh));
  useRuntimeStore.getState().setResourceState(key, {
    status: isBackground ? "refreshing" : "loading",
    error: null,
    inFlight: true,
  });

  const startedAt = Date.now();
  let attempt = 0;

  while (attempt < policy.retry.attempts) {
    attempt += 1;

    try {
      const incoming = await definition.fetcher({
        key,
        params: options?.params,
      });
      const current = getRuntimeResourceState<TData>(key);
      const merged = reconcileResourceData<TData>({
        current: current.data,
        lastGood: current.lastGoodData,
        incoming,
        policy,
        isBackground,
      });

      useRuntimeStore.getState().setResourceState(key, {
        data: merged.data,
        lastGoodData: merged.lastGoodData,
        status: "success",
        error: null,
        inFlight: false,
        retryCount: attempt - 1,
        cooldownUntil: null,
        updatedAt: Date.now(),
      });

      recordRuntimeTelemetry({
        key,
        operation: isBackground ? "refresh" : "load",
        durationMs: Date.now() - startedAt,
        success: merged.changed,
      });

      if (!merged.changed) {
        recordRuntimeTelemetry({ key, operation: "refresh", success: false });
      }

      return merged.data;
    } catch (error) {
      const retryable = isRetryableError(error);
      const shouldRetry = retryable && attempt < policy.retry.attempts;

      if (shouldRetry) {
        recordRuntimeTelemetry({ key, operation: "retry" });
        const delay = computeBackoffDelay(policy, attempt);
        await wait(delay);
        continue;
      }

      const message = error instanceof Error ? error.message : "Failed to load runtime resource";
      useRuntimeStore.getState().setResourceState(key, {
        status: state.data ? "success" : "error",
        error: message,
        inFlight: false,
        retryCount: attempt,
        cooldownUntil: Date.now() + policy.retry.cooldownMs,
      });
      return state.data;
    }
  }

  return state.data;
}
