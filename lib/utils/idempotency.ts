import { createHash } from "crypto";
import {
  cacheAcquireIdempotencyKey,
  cacheGet,
  cacheSet,
  type CacheIdempotencyAcquireResult,
} from "@/lib/cache/redis";

const LOCAL_CACHE_LIMIT = 5_000;
const localAcquireGuard = new Map<string, number>();
const localReplayStore = new Map<string, { status: number; body: Record<string, unknown>; expiresAt: number }>();

export type IdempotencyAcquireMode = "redis" | "local-memory";

export type IdempotencyReplayResponse = {
  status: number;
  body: Record<string, unknown>;
};

function sanitizeKeyPart(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9:_-]/g, "-").slice(0, 120);
}

function pruneLocalStore(map: Map<string, number>, now = Date.now()) {
  for (const [key, expiresAt] of map.entries()) {
    if (expiresAt <= now) {
      map.delete(key);
    }
  }
}

function pruneLocalReplay(now = Date.now()) {
  for (const [key, entry] of localReplayStore.entries()) {
    if (entry.expiresAt <= now) {
      localReplayStore.delete(key);
    }
  }
}

function acquireLocalKey(key: string, ttlSeconds: number): boolean {
  const now = Date.now();
  pruneLocalStore(localAcquireGuard, now);

  if (localAcquireGuard.has(key)) return false;

  if (localAcquireGuard.size >= LOCAL_CACHE_LIMIT) {
    const oldest = localAcquireGuard.keys().next().value;
    if (oldest) localAcquireGuard.delete(oldest);
  }

  localAcquireGuard.set(key, now + ttlSeconds * 1000);
  return true;
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }

  const objectValue = value as Record<string, unknown>;
  const keys = Object.keys(objectValue).sort();
  const serialized = keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(objectValue[key])}`);
  return `{${serialized.join(",")}}`;
}

function buildCacheKey(scope: string, key: string): string {
  return `idempotency:${sanitizeKeyPart(scope)}:${sanitizeKeyPart(key)}`;
}

function buildReplayCacheKey(scope: string, key: string): string {
  return `idempotency:replay:${sanitizeKeyPart(scope)}:${sanitizeKeyPart(key)}`;
}

export function buildPayloadFingerprint(payload: unknown): string {
  const serialized = stableSerialize(payload);
  return createHash("sha256").update(serialized).digest("hex").slice(0, 40);
}

export function readIdempotencyKeyHeader(headers: Headers): string | null {
  const candidate =
    headers.get("x-idempotency-key") ||
    headers.get("x-request-key") ||
    headers.get("idempotency-key");
  if (!candidate) return null;
  const normalized = candidate.trim();
  return normalized.length > 0 ? normalized.slice(0, 120) : null;
}

export async function acquireIdempotencyGuard(options: {
  scope: string;
  key: string;
  ttlSeconds: number;
}): Promise<{ acquired: boolean; mode: IdempotencyAcquireMode }> {
  const { scope, key, ttlSeconds } = options;
  const cacheKey = buildCacheKey(scope, key);
  const redisAcquire: CacheIdempotencyAcquireResult = await cacheAcquireIdempotencyKey(cacheKey, ttlSeconds);

  if (redisAcquire === "acquired") {
    return { acquired: true, mode: "redis" };
  }
  if (redisAcquire === "exists") {
    return { acquired: false, mode: "redis" };
  }

  const acquired = acquireLocalKey(cacheKey, ttlSeconds);
  return { acquired, mode: "local-memory" };
}

export async function setIdempotencyReplayResponse(options: {
  scope: string;
  key: string;
  status: number;
  body: Record<string, unknown>;
  ttlSeconds: number;
}) {
  const { scope, key, status, body, ttlSeconds } = options;
  const replayKey = buildReplayCacheKey(scope, key);
  const expiresAt = Date.now() + ttlSeconds * 1000;

  pruneLocalReplay();
  localReplayStore.set(replayKey, { status, body, expiresAt });

  await cacheSet(replayKey, { status, body }, ttlSeconds);
}

export async function getIdempotencyReplayResponse(options: {
  scope: string;
  key: string;
}): Promise<IdempotencyReplayResponse | null> {
  const { scope, key } = options;
  const replayKey = buildReplayCacheKey(scope, key);

  pruneLocalReplay();
  const local = localReplayStore.get(replayKey);
  if (local) {
    return { status: local.status, body: local.body };
  }

  const cached = await cacheGet<{ status?: number; body?: Record<string, unknown> }>(replayKey);
  if (!cached || typeof cached !== "object" || !cached.body || typeof cached.body !== "object") {
    return null;
  }

  return {
    status: typeof cached.status === "number" ? cached.status : 200,
    body: cached.body,
  };
}
