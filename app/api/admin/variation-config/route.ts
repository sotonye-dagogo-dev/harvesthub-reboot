import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/auth";
import { UserRole } from "@/lib/constants";
import {
  getProductVariationConfig,
  upsertProductVariationConfig,
} from "@/lib/services/productVariationConfig";
import { DEFAULT_VARIATION_CONFIG } from "@/lib/config/productVariations";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const config = await getProductVariationConfig();
    return NextResponse.json({ success: true, config, defaults: DEFAULT_VARIATION_CONFIG });
  } catch (error) {
    console.error("[Admin variation-config GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch config" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    // Validate shape non-blocking: allow partial updates, fallback to defaults if malformed
    const categories = Array.isArray(body.categories) ? body.categories : undefined;
    const version =
      typeof body.version === "number" && Number.isFinite(body.version) ? body.version : undefined;

    if (categories !== undefined) {
      for (const entry of categories) {
        if (!entry || typeof entry !== "object") {
          return NextResponse.json({ success: false, error: "Each category entry must be an object" }, { status: 400 });
        }
        const e = entry as Record<string, unknown>;
        if (!Array.isArray(e.categories) || !Array.isArray(e.variations)) {
          return NextResponse.json(
            { success: false, error: "Each entry requires categories[] and variations[]" },
            { status: 400 }
          );
        }
      }
    }

    const saved = await upsertProductVariationConfig({
      categories: categories as never,
      version,
      updatedBy: user.userId,
    });

    return NextResponse.json({ success: true, config: saved });
  } catch (error) {
    console.error("[Admin variation-config PUT]", error);
    return NextResponse.json({ success: false, error: "Failed to update config" }, { status: 500 });
  }
}
