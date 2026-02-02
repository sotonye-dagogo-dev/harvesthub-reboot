import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import type { Product } from "@/lib/types";

// GET /api/products/featured - Get featured products
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "10");

        // Get all products without pagination
        const productsResult = db.products.findAll({});
        let products = Array.isArray(productsResult) ? productsResult : productsResult.data;

        // Get featured and active products
        products = products.filter((p: Product) => p.isFeatured && p.isActive);

        // Sort by newest
        products.sort((a: Product, b: Product) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Limit results
        products = products.slice(0, limit);

        return NextResponse.json({
            success: true,
            products
        });
    } catch (error) {
        console.error("Get featured products error:", error);
        return NextResponse.json(
            { error: "Failed to fetch featured products" },
            { status: 500 }
        );
    }
}
