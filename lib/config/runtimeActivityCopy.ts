export type RuntimeActivityTier = "brief" | "medium" | "extended";

export function getRuntimeActivityTier(activeRuntimeOps: number): RuntimeActivityTier {
  if (activeRuntimeOps >= 6) return "extended";
  if (activeRuntimeOps >= 3) return "medium";
  return "brief";
}

export function shouldShowRuntimeActivity(activeRuntimeOps: number, elapsedMs: number): boolean {
  if (activeRuntimeOps <= 0) return false;
  // Show quickly for higher activity, delay medium activity slightly, and for exactly one
  // in-flight operation only show if it keeps running long enough to be user-noticeable.
  if (activeRuntimeOps >= 3) return elapsedMs >= 700;
  if (activeRuntimeOps === 2) return elapsedMs >= 1500;
  return elapsedMs >= 4000;
}

export function getRuntimeActivityMessage(activeRuntimeOps: number): string {
  const tier = getRuntimeActivityTier(activeRuntimeOps);
  if (tier === "extended") return "This might take a while";
  if (tier === "medium") return "Almost there";
  return "Just a moment";
}
