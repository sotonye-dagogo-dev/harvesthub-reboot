import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import type { Product } from "@/lib/types";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET /api/products/[id]/related - Get related products
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "6");

        const product = await db.products.findById(id);

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Get all products without pagination
        const productsResult = db.products.findAll({});
        let products = Array.isArray(productsResult) ? productsResult : productsResult.data;

        // Get active products in same category, excluding current product
        products = products.filter((p: Product) =>
            p.isActive &&
            p.id !== id &&
            (p.category === product.category || p.vendorId === product.vendorId)
        );

        // Prioritize same category, then same vendor
        products.sort((a: Product, b: Product) => {
            if (a.category === product.category && b.category !== product.category) return -1;
            if (a.category !== product.category && b.category === product.category) return 1;
            if (a.vendorId === product.vendorId && b.vendorId !== product.vendorId) return -1;
            if (a.vendorId !== product.vendorId && b.vendorId === product.vendorId) return 1;
            return 0;
        });

        // Limit results
        products = products.slice(0, limit);

        return NextResponse.json({
            success: true,
            products
        });
    } catch (error) {
        console.error("Get related products error:", error);
        return NextResponse.json(
            { error: "Failed to fetch related products" },
            { status: 500 }
        );
    }
}
