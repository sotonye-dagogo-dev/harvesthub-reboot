import type { RuntimeRole } from "@/lib/data-runtime/contracts";
import { canAccessResource } from "@/lib/data-runtime/contracts";
import { listRuntimeResources } from "@/lib/data-runtime/resourceRegistry";
import { loadRuntimeResource } from "@/lib/data-runtime/runtimeClient";

export async function prefetchRuntimeResources(input: {
  role: RuntimeRole;
  tags?: string[];
  force?: boolean;
}): Promise<void> {
  const definitions = listRuntimeResources().filter((definition) => {
    if (!canAccessResource(definition.scope, input.role)) {
      return false;
    }

    if (!input.tags || input.tags.length === 0) {
      return true;
    }

    if (!definition.tags || definition.tags.length === 0) {
      return false;
    }

    return definition.tags.some((tag) => input.tags?.includes(tag));
  });

  await Promise.all(
    definitions.map(async (definition) => {
      try {
        await loadRuntimeResource(definition.key, { force: input.force, background: true });
      } catch {
        // Keep bootstrap prefetch non-blocking
      }
    })
  );
}
