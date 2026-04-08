import type { RuntimeCompareFn, RuntimeResourcePolicy } from "@/lib/data-runtime/contracts";

type MergeInput<TData> = {
  current: TData | undefined;
  lastGood: TData | undefined;
  incoming: TData;
  policy: RuntimeResourcePolicy<TData>;
  isBackground: boolean;
};

type MergeResult<TData> = {
  data: TData;
  lastGoodData: TData;
  changed: boolean;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0
  );
  return `{${entries
    .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`)
    .join(",")}}`;
}

function shallowEqualObjects(a: unknown, b: unknown): boolean {
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;

  const aEntries = Object.entries(a as Record<string, unknown>);
  const bEntries = Object.entries(b as Record<string, unknown>);
  if (aEntries.length !== bEntries.length) return false;

  return aEntries.every(([key, value]) => Object.is(value, (b as Record<string, unknown>)[key]));
}

export function areResourcesEqual<TData>(
  previous: TData | undefined,
  next: TData,
  compareStrategy: RuntimeResourcePolicy<TData>["compareStrategy"]
): boolean {
  if (typeof previous === "undefined") return false;
  if (Object.is(previous, next)) return true;

  if (typeof compareStrategy === "function") {
    return (compareStrategy as RuntimeCompareFn<TData>)(previous, next);
  }

  if (compareStrategy === "reference") {
    return Object.is(previous, next);
  }

  if (compareStrategy === "shallow") {
    return shallowEqualObjects(previous, next);
  }

  return stableStringify(previous) === stableStringify(next);
}

export function reconcileResourceData<TData>({
  current,
  lastGood,
  incoming,
  policy,
  isBackground,
}: MergeInput<TData>): MergeResult<TData> {
  const changed = !areResourcesEqual(current, incoming, policy.compareStrategy);

  if (!changed && typeof current !== "undefined") {
    return {
      data: current,
      lastGoodData: typeof lastGood === "undefined" ? current : lastGood,
      changed: false,
    };
  }

  if (isBackground && typeof current !== "undefined" && policy.silentRefresh) {
    return {
      data: incoming,
      lastGoodData: incoming,
      changed,
    };
  }

  return {
    data: incoming,
    lastGoodData: incoming,
    changed,
  };
}
