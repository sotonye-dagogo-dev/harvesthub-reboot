export function getFirstValidImageUrl(images?: string[] | null): string | null {
  if (!Array.isArray(images)) return null;
  const candidate = images.find((img) => typeof img === "string" && img.trim().length > 0);
  return candidate ? candidate.trim() : null;
}
