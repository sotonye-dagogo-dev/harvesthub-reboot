import type { RuntimeTelemetryEvent } from "@/lib/data-runtime/contracts";

type RuntimeMetricBucket = {
  loadLatencyMs: number[];
  refreshCount: number;
  noOpRefreshCount: number;
  retryCount: number;
  rollbackCount: number;
};

const telemetryStore = new Map<string, RuntimeMetricBucket>();

function getBucket(key: string): RuntimeMetricBucket {
  const existing = telemetryStore.get(key);
  if (existing) return existing;

  const next: RuntimeMetricBucket = {
    loadLatencyMs: [],
    refreshCount: 0,
    noOpRefreshCount: 0,
    retryCount: 0,
    rollbackCount: 0,
  };
  telemetryStore.set(key, next);
  return next;
}

export function recordRuntimeTelemetry(event: RuntimeTelemetryEvent): void {
  const bucket = getBucket(event.key);

  if ((event.operation === "load" || event.operation === "refresh") && typeof event.durationMs === "number") {
    bucket.loadLatencyMs.push(event.durationMs);
  }

  if (event.operation === "refresh") {
    bucket.refreshCount += 1;
    if (event.success === false) {
      bucket.noOpRefreshCount += 1;
    }
  }

  if (event.operation === "retry") {
    bucket.retryCount += 1;
  }

  if (event.operation === "rollback") {
    bucket.rollbackCount += 1;
  }
}

export function readRuntimeTelemetry(key?: string) {
  if (key) {
    return telemetryStore.get(key);
  }

  return Object.fromEntries(telemetryStore.entries());
}

export function resetRuntimeTelemetry(key?: string): void {
  if (key) {
    telemetryStore.delete(key);
    return;
  }

  telemetryStore.clear();
}
