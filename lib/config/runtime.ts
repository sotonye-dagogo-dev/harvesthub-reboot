import { UserRole } from "@/lib/constants";

export type RuntimeCompareStrategy = "deep" | "shallow" | "reference";

export type RuntimeRetryConfig = {
  attempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio: number;
  cooldownMs: number;
};

export type RuntimePolicyDefaults = {
  staleTimeMs: number;
  ttlMs: number;
  spinnerThresholdMs: number;
  silentRefresh: boolean;
  compareStrategy: RuntimeCompareStrategy;
  retry: RuntimeRetryConfig;
};

export const RUNTIME_POLICY_DEFAULTS: RuntimePolicyDefaults = {
  staleTimeMs: 30_000,
  ttlMs: 5 * 60_000,
  spinnerThresholdMs: 250,
  silentRefresh: true,
  compareStrategy: "deep",
  retry: {
    attempts: 3,
    baseDelayMs: 350,
    maxDelayMs: 4_000,
    jitterRatio: 0.35,
    cooldownMs: 12_000,
  },
};

export const RUNTIME_PREFETCH_ROUTE_TAGS: ReadonlyArray<{
  match: RegExp;
  tags: string[];
}> = [
  { match: /^\/operations/, tags: ["operations"] },
  { match: /^\/products/, tags: ["buyer-products"] },
  { match: /^\/$/, tags: ["home"] },
  { match: /^\/checkout|^\/cart/, tags: ["checkout"] },
  { match: /^\/orders/, tags: ["orders"] },
  { match: /^\/wallet/, tags: ["wallet"] },
  { match: /^\/notifications/, tags: ["notifications"] },
  { match: /^\/profile/, tags: ["profile"] },
];

export const ROLE_PREFETCH_HINTS: Record<UserRole | "GUEST", string[]> = {
  ADMIN: ["operations", "orders", "notifications"],
  VENDOR: ["operations", "orders", "notifications", "wallet"],
  BUYER: ["home", "buyer-products", "checkout", "orders", "wallet", "notifications", "profile"],
  GUEST: ["home", "buyer-products"],
};
