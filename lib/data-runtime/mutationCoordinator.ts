import {
  updateRuntimeResourceData,
  getRuntimeResourceState,
  useRuntimeStore,
} from "@/lib/data-runtime/runtimeStore";
import { recordRuntimeTelemetry } from "@/lib/data-runtime/telemetry";

type OptimisticMutationConfig<TResource, TServerResult> = {
  key: string;
  applyOptimistic: (previous: TResource | undefined) => TResource;
  commit: () => Promise<TServerResult>;
  reconcile: (current: TResource | undefined, serverResult: TServerResult) => TResource;
  mapError?: (error: unknown) => Error;
};

export async function runOptimisticMutation<TResource, TServerResult>({
  key,
  applyOptimistic,
  commit,
  reconcile,
  mapError,
}: OptimisticMutationConfig<TResource, TServerResult>): Promise<TServerResult> {
  const previous = getRuntimeResourceState<TResource>(key).data;

  useRuntimeStore.getState().setResourceState(key, {
    inFlight: true,
    status: typeof previous === "undefined" ? "loading" : "refreshing",
    error: null,
  });

  updateRuntimeResourceData<TResource>(key, (current) => applyOptimistic(current));

  try {
    const serverResult = await commit();
    updateRuntimeResourceData<TResource>(key, (current) => reconcile(current, serverResult));
    useRuntimeStore.getState().setResourceState(key, {
      inFlight: false,
      status: "success",
      error: null,
    });
    return serverResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mutation failed";
    useRuntimeStore.getState().setResourceState(key, {
      data: previous,
      lastGoodData: previous,
      updatedAt: Date.now(),
      status: typeof previous === "undefined" ? "error" : "success",
      inFlight: false,
      error: message,
    });
    recordRuntimeTelemetry({ key, operation: "rollback" });

    if (mapError) {
      throw mapError(error);
    }

    throw error;
  }
}
