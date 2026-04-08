import { getBannersClient, getProductsClient, getUsersClient, getVendorsClient } from "@/lib/data/clientDataFetchers";
import { UserRole } from "@/lib/constants";
import type {
  RuntimeResourceDefinition,
  RuntimeResourcePolicy,
  RuntimePolicyOverride,
} from "@/lib/data-runtime/contracts";
import { mergeRuntimePolicy } from "@/lib/data-runtime/contracts";
import { RUNTIME_POLICY_DEFAULTS } from "@/lib/config/runtime";

const registry = new Map<string, RuntimeResourceDefinition<unknown, unknown>>();

export function defineRuntimeResource<TData, TParams = unknown>(
  definition: RuntimeResourceDefinition<TData, TParams>
): RuntimeResourceDefinition<TData, TParams> {
  return definition;
}

export function registerRuntimeResource<TData, TParams = unknown>(
  definition: RuntimeResourceDefinition<TData, TParams>
): void {
  registry.set(definition.key, definition as RuntimeResourceDefinition<unknown, unknown>);
}

export function registerRuntimeResources(
  definitions: RuntimeResourceDefinition<unknown, unknown>[]
): void {
  definitions.forEach((definition) => registerRuntimeResource(definition));
}

export function getRuntimeResourceDefinition<TData = unknown, TParams = unknown>(
  key: string
): RuntimeResourceDefinition<TData, TParams> | undefined {
  const definition = registry.get(key);
  return definition as RuntimeResourceDefinition<TData, TParams> | undefined;
}

export function getRuntimeResourcePolicy<TData>(
  key: string,
  policyOverride?: RuntimePolicyOverride<TData>
): RuntimeResourcePolicy<TData> {
  const definition = getRuntimeResourceDefinition<TData>(key);
  return mergeRuntimePolicy<TData>(
    RUNTIME_POLICY_DEFAULTS,
    (policyOverride ?? definition?.policy) as RuntimePolicyOverride<TData> | undefined
  );
}

export function listRuntimeResources(): RuntimeResourceDefinition[] {
  return Array.from(registry.values());
}

registerRuntimeResources([
  defineRuntimeResource({
    key: "home:banners",
    scope: { visibility: "public" },
    tags: ["home"],
    policy: { staleTimeMs: 30_000, ttlMs: 5 * 60_000, silentRefresh: true },
    fetcher: async () => getBannersClient(),
  }),
  defineRuntimeResource({
    key: "home:products",
    scope: { visibility: "public" },
    tags: ["home", "buyer-products"],
    policy: { staleTimeMs: 20_000, ttlMs: 5 * 60_000 },
    fetcher: async () => getProductsClient({ limit: 120 }),
  }),
  defineRuntimeResource({
    key: "home:vendors",
    scope: { visibility: "public" },
    tags: ["home"],
    policy: { staleTimeMs: 30_000, ttlMs: 5 * 60_000 },
    fetcher: async () => getVendorsClient(120),
  }),
  defineRuntimeResource({
    key: "operations:users",
    scope: { visibility: "role", roles: [UserRole.ADMIN] },
    tags: ["operations"],
    policy: { staleTimeMs: 15_000, ttlMs: 3 * 60_000 },
    fetcher: async () => getUsersClient(),
  }),
] as RuntimeResourceDefinition<unknown, unknown>[]);
