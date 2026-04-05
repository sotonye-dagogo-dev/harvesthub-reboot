const ALLOWED_REMOTE_IMAGE_HOSTS = new Set([
  "images.unsplash.com",
  "res.cloudinary.com",
  "api.dicebear.com",
]);

export function getSafeImageUrl(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (!candidate || candidate === "null" || candidate === "undefined") return null;

  if (candidate.startsWith("/")) return candidate;

  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    if (!ALLOWED_REMOTE_IMAGE_HOSTS.has(parsed.hostname)) return null;
    return candidate;
  } catch {
    return null;
  }
}

export function getFirstValidImageUrl(images?: string[] | null): string | null {
  if (!Array.isArray(images)) return null;
  for (const image of images) {
    const safeImage = getSafeImageUrl(image);
    if (safeImage) return safeImage;
  }
  return null;
}
