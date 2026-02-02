import { NextResponse } from "next/server";
import { db } from "@/lib/data/database";

// GET /api/products/new-arrivals - Get recently added products
export async function GET() {
    try {
        // Get all products (returns array when no pagination params)
        const allProducts = await db.products.findAll();

        // Type guard to ensure we have an array
        const productsArray = Array.isArray(allProducts) ? allProducts : allProducts.data;

        // Sort by createdAt descending and get the 20 most recent
        const sortedProducts = productsArray
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 20);

        return NextResponse.json({
            success: true,
            products: sortedProducts,
            total: sortedProducts.length,
        });
    } catch (error) {
        console.error("Get new arrivals error:", error);
        return NextResponse.json(
            { error: "Failed to fetch new arrivals" },
            { status: 500 }
        );
    }
}
