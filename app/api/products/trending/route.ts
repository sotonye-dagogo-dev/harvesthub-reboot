import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import type { Product } from "@/lib/types";

// GET /api/products/trending - Get trending/popular products
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "10");

        // Get all products without pagination
        const productsResult = db.products.findAll({});
        let products = Array.isArray(productsResult) ? productsResult : productsResult.data;

        // Get active products
        products = products.filter((p: Product) => p.isActive);

        // Sort by sales (popularity)
        products.sort((a: Product, b: Product) => (b.sales || 0) - (a.sales || 0));

        // Limit results
        products = products.slice(0, limit);

        return NextResponse.json({
            success: true,
            products
        });
    } catch (error) {
        console.error("Get trending products error:", error);
        return NextResponse.json(
            { error: "Failed to fetch trending products" },
            { status: 500 }
        );
    }
}
