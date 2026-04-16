export function generateRequestKey(scope: string): string {
  const normalizedScope = scope.replace(/[^a-zA-Z0-9:_-]/g, "-");
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${normalizedScope}:${crypto.randomUUID()}`;
  }
  return `${normalizedScope}:${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
