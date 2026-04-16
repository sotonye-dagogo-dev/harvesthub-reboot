import type { Metadata } from "next";
import { headers } from "next/headers";

const DEFAULT_TITLE = "MyHarvestHub";
const DEFAULT_DESCRIPTION = "Next-gen agriculture e-commerce for campus vendors and buyers";
const DEFAULT_IMAGE_PATH = "/myharvesthublogo.png";

function normalizeText(value: string | null | undefined, fallback: string): string {
  const normalized = (value || "").trim();
  return normalized.length > 0 ? normalized : fallback;
}

function resolveAbsoluteUrl(baseUrl: string, pathOrUrl: string): string {
  try {
    return new URL(pathOrUrl, baseUrl).toString();
  } catch {
    return new URL("/", baseUrl).toString();
  }
}

export async function resolveCanonicalBaseUrl(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const protocol =
    headerStore.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export function buildDynamicEntityMetadata(input: {
  baseUrl: string;
  path: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  fallbackTitle?: string;
  fallbackDescription?: string;
}): Metadata {
  const fallbackTitle = input.fallbackTitle || DEFAULT_TITLE;
  const fallbackDescription = input.fallbackDescription || DEFAULT_DESCRIPTION;
  const title = normalizeText(input.title, fallbackTitle);
  const description = normalizeText(input.description, fallbackDescription);
  const canonicalUrl = resolveAbsoluteUrl(input.baseUrl, input.path);
  const imageUrl = resolveAbsoluteUrl(
    input.baseUrl,
    normalizeText(input.imageUrl, DEFAULT_IMAGE_PATH)
  );

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: [{ url: imageUrl, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
