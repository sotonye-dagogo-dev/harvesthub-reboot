import { UserRole } from "@/lib/constants";
import type {
  RuntimeCompareStrategy,
  RuntimePolicyDefaults,
  RuntimeRetryConfig,
} from "@/lib/config/runtime";

export type RuntimeRole = UserRole | "GUEST";

export type ResourceVisibility = "public" | "authenticated" | "role";

export type RuntimeResourceScope = {
  visibility: ResourceVisibility;
  roles?: UserRole[];
};

export type RuntimeResourceStatus = "idle" | "loading" | "refreshing" | "success" | "error";

export type RuntimeCompareFn<TData> = (
  previous: TData | undefined,
  next: TData
) => boolean;

export type RuntimeResourcePolicy<TData = unknown> = {
  staleTimeMs: number;
  ttlMs: number;
  spinnerThresholdMs: number;
  silentRefresh: boolean;
  compareStrategy: RuntimeCompareStrategy | RuntimeCompareFn<TData>;
  retry: RuntimeRetryConfig;
};

export type RuntimePolicyOverride<TData = unknown> = Partial<
  Omit<RuntimeResourcePolicy<TData>, "retry">
> & {
  retry?: Partial<RuntimeRetryConfig>;
};

export type RuntimeFetchContext<TParams = unknown> = {
  key: string;
  params?: TParams;
  signal?: AbortSignal;
};

export type RuntimeResourceDefinition<TData = unknown, TParams = unknown> = {
  key: string;
  fetcher: (context: RuntimeFetchContext<TParams>) => Promise<TData>;
  scope: RuntimeResourceScope;
  policy?: RuntimePolicyOverride<TData>;
  tags?: string[];
};

export type RuntimeLoadOptions<TParams = unknown> = {
  force?: boolean;
  background?: boolean;
  params?: TParams;
};

export type RuntimeAdapter<TState = unknown> = {
  getSnapshot: () => TState;
  subscribe: (listener: () => void) => () => void;
};

export type RuntimeTelemetryEvent = {
  key: string;
  operation: "load" | "refresh" | "retry" | "rollback";
  durationMs?: number;
  success?: boolean;
};

export function mergeRuntimePolicy<TData = unknown>(
  defaults: RuntimePolicyDefaults,
  override?: RuntimePolicyOverride<TData>
): RuntimeResourcePolicy<TData> {
  return {
    staleTimeMs: override?.staleTimeMs ?? defaults.staleTimeMs,
    ttlMs: override?.ttlMs ?? defaults.ttlMs,
    spinnerThresholdMs: override?.spinnerThresholdMs ?? defaults.spinnerThresholdMs,
    silentRefresh: override?.silentRefresh ?? defaults.silentRefresh,
    compareStrategy: override?.compareStrategy ?? defaults.compareStrategy,
    retry: {
      attempts: override?.retry?.attempts ?? defaults.retry.attempts,
      baseDelayMs: override?.retry?.baseDelayMs ?? defaults.retry.baseDelayMs,
      maxDelayMs: override?.retry?.maxDelayMs ?? defaults.retry.maxDelayMs,
      jitterRatio: override?.retry?.jitterRatio ?? defaults.retry.jitterRatio,
      cooldownMs: override?.retry?.cooldownMs ?? defaults.retry.cooldownMs,
    },
  };
}

export function canAccessResource(scope: RuntimeResourceScope, role: RuntimeRole): boolean {
  if (scope.visibility === "public") return true;
  if (scope.visibility === "authenticated") return role !== "GUEST";
  if (scope.visibility === "role") {
    return role !== "GUEST" && Array.isArray(scope.roles) && scope.roles.includes(role as UserRole);
  }
  return false;
}
