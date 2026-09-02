import { prisma } from "@/lib/db/prisma";
import {
  DEFAULT_VARIATION_CONFIG,
  type ProductVariationConfig,
} from "@/lib/config/productVariations";

function normalizeConfig(raw: unknown): ProductVariationConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  if (!Array.isArray(candidate.categories)) return null;
  return candidate as ProductVariationConfig;
}

export async function getProductVariationConfig(): Promise<ProductVariationConfig> {
  try {
    const prismaTyped = prisma as unknown as {
      productVariationConfig?: {
        findUnique: (args: unknown) => Promise<{ categories: unknown; version: number; updatedAt: Date; updatedBy: string | null } | null>;
      };
    };
    if (!prismaTyped.productVariationConfig) return DEFAULT_VARIATION_CONFIG;
    const row = await prismaTyped.productVariationConfig.findUnique({
      where: { key: "default" },
    });
    if (!row || !Array.isArray(row.categories as unknown)) return DEFAULT_VARIATION_CONFIG;
    const configured: ProductVariationConfig = {
      version: row.version,
      categories: row.categories as unknown as ProductVariationConfig["categories"],
      updatedAt: row.updatedAt?.toISOString(),
      updatedBy: row.updatedBy,
    };
    if (configured.categories.length === 0) return DEFAULT_VARIATION_CONFIG;
    return configured;
  } catch {
    return DEFAULT_VARIATION_CONFIG;
  }
}

export async function upsertProductVariationConfig(
  patch: Partial<ProductVariationConfig> & { updatedBy?: string | null }
): Promise<ProductVariationConfig> {
  const existing = await getProductVariationConfig();
  const next: ProductVariationConfig = {
    version: (patch.version ?? existing.version ?? 1) as number,
    categories: (patch.categories as ProductVariationConfig["categories"]) ?? existing.categories,
    updatedAt: new Date().toISOString(),
    updatedBy: patch.updatedBy ?? existing.updatedBy ?? null,
  };

  try {
    const prismaTyped = prisma as unknown as {
      productVariationConfig?: {
        upsert: (args: unknown) => Promise<unknown>;
      };
    };
    if (!prismaTyped.productVariationConfig) return next;
    await prismaTyped.productVariationConfig.upsert({
      where: { key: "default" },
      update: {
        version: next.version,
        categories: next.categories as unknown as object,
        updatedBy: next.updatedBy,
      },
      create: {
        key: "default",
        version: next.version,
        categories: next.categories as unknown as object,
        updatedBy: next.updatedBy,
      },
    });
  } catch (e) {
    console.warn("[VariationConfig] upsert failed, returning in-memory config", e);
  }
  return next;
}
