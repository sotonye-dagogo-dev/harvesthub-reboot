import { NextResponse } from "next/server";
import { getProductVariationConfig } from "@/lib/services/productVariationConfig";
import { DEFAULT_VARIATION_CONFIG } from "@/lib/config/productVariations";

/**
 * GET /api/config/variation-config — public, non-blocking.
 * Always returns a config (DB override or DEFAULT) — never 500.
 */
export async function GET() {
  try {
    const config = await getProductVariationConfig();
    return NextResponse.json({ success: true, config }, { status: 200 });
  } catch (error) {
    console.warn("[GET variation-config] fallback to default", error);
    return NextResponse.json(
      { success: true, config: DEFAULT_VARIATION_CONFIG, fallback: true },
      { status: 200 }
    );
  }
}
