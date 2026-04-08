import { updateRuntimeResourceData, getRuntimeResourceState } from "@/lib/data-runtime/runtimeStore";
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

  updateRuntimeResourceData<TResource>(key, (current) => applyOptimistic(current));

  try {
    const serverResult = await commit();
    updateRuntimeResourceData<TResource>(key, (current) => reconcile(current, serverResult));
    return serverResult;
  } catch (error) {
    updateRuntimeResourceData<TResource>(key, () => {
      if (typeof previous === "undefined") {
        return applyOptimistic(undefined);
      }
      return previous;
    });
    recordRuntimeTelemetry({ key, operation: "rollback" });

    if (mapError) {
      throw mapError(error);
    }

    throw error;
  }
}
