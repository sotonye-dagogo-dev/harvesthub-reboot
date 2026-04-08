import { create } from "zustand";
import type { RuntimeResourceStatus } from "@/lib/data-runtime/contracts";

export type RuntimeResourceState<TData = unknown> = {
  data?: TData;
  lastGoodData?: TData;
  status: RuntimeResourceStatus;
  error: string | null;
  updatedAt: number | null;
  inFlight: boolean;
  retryCount: number;
  cooldownUntil: number | null;
};

type RuntimeStoreState = {
  resources: Record<string, RuntimeResourceState<unknown>>;
  setResourceState: (key: string, next: Partial<RuntimeResourceState<unknown>>) => void;
  replaceResourceState: (key: string, next: RuntimeResourceState<unknown>) => void;
  removeResource: (key: string) => void;
  clearAll: () => void;
};

function defaultResourceState(): RuntimeResourceState<unknown> {
  return {
    data: undefined,
    lastGoodData: undefined,
    status: "idle",
    error: null,
    updatedAt: null,
    inFlight: false,
    retryCount: 0,
    cooldownUntil: null,
  };
}

export const useRuntimeStore = create<RuntimeStoreState>((set) => ({
  resources: {},
  setResourceState: (key, next) =>
    set((state) => {
      const current = state.resources[key] ?? defaultResourceState();
      return {
        resources: {
          ...state.resources,
          [key]: {
            ...current,
            ...next,
          },
        },
      };
    }),
  replaceResourceState: (key, next) =>
    set((state) => ({
      resources: {
        ...state.resources,
        [key]: next,
      },
    })),
  removeResource: (key) =>
    set((state) => {
      const next = { ...state.resources };
      delete next[key];
      return { resources: next };
    }),
  clearAll: () => set({ resources: {} }),
}));

export function getRuntimeResourceState<TData = unknown>(
  key: string
): RuntimeResourceState<TData> {
  const resource = useRuntimeStore.getState().resources[key];
  if (!resource) return defaultResourceState() as RuntimeResourceState<TData>;
  return resource as RuntimeResourceState<TData>;
}

export function updateRuntimeResourceData<TData>(
  key: string,
  updater: (prev: TData | undefined) => TData
): void {
  const previous = getRuntimeResourceState<TData>(key);
  const nextData = updater(previous.data);
  useRuntimeStore.getState().setResourceState(key, {
    data: nextData,
    lastGoodData: nextData,
    status: "success",
    error: null,
    updatedAt: Date.now(),
  });
}
