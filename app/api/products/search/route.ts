import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import type { Product } from "@/lib/types";

// GET /api/products/search - Advanced product search
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q") || "";
        const category = searchParams.get("category");
        const vendorId = searchParams.get("vendorId");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const minRating = searchParams.get("minRating");
        const inStock = searchParams.get("inStock") === "true";
        const sort = searchParams.get("sort") || "newest";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        // Get all products without pagination
        const productsResult = db.products.findAll({});
        let products = Array.isArray(productsResult) ? productsResult : productsResult.data;

        // Filter active products only
        products = products.filter((p: Product) => p.isActive);

        // Search by query (name, description)
        if (query) {
            const lowerQuery = query.toLowerCase();
            products = products.filter((p: Product) =>
                p.name.toLowerCase().includes(lowerQuery) ||
                (p.description && p.description.toLowerCase().includes(lowerQuery))
            );
        }

        // Filter by category
        if (category) {
            products = products.filter((p: Product) => p.category === category);
        }

        // Filter by vendor
        if (vendorId) {
            products = products.filter((p: Product) => p.vendorId === vendorId);
        }

        // Filter by price range
        if (minPrice) {
            products = products.filter((p: Product) => p.price >= parseFloat(minPrice));
        }
        if (maxPrice) {
            products = products.filter((p: Product) => p.price <= parseFloat(maxPrice));
        }

        // Filter by rating
        if (minRating) {
            const rating = parseFloat(minRating);
            products = products.filter((p: Product) => (p.averageRating || 0) >= rating);
        }

        // Filter by stock
        if (inStock) {
            products = products.filter((p: Product) => p.stock > 0);
        }

        // Sort products
        switch (sort) {
            case "price-low":
                products.sort((a: Product, b: Product) => a.price - b.price);
                break;
            case "price-high":
                products.sort((a: Product, b: Product) => b.price - a.price);
                break;
            case "rating":
                products.sort((a: Product, b: Product) => (b.averageRating || 0) - (a.averageRating || 0));
                break;
            case "popular":
                products.sort((a: Product, b: Product) => (b.sales || 0) - (a.sales || 0));
                break;
            case "newest":
            default:
                products.sort((a: Product, b: Product) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
        }

        // Pagination
        const total = products.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const paginatedProducts = products.slice(startIndex, startIndex + limit);

        // Get available filters (for UI)
        const availableCategories = [...new Set(products.map((p: Product) => p.category))];
        const priceRange = {
            min: products.length > 0 ? Math.min(...products.map((p: Product) => p.price)) : 0,
            max: products.length > 0 ? Math.max(...products.map((p: Product) => p.price)) : 0,
        };

        return NextResponse.json({
            success: true,
            products: paginatedProducts,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasMore: page < totalPages,
            },
            filters: {
                categories: availableCategories,
                priceRange,
            }
        });
    } catch (error) {
        console.error("Product search error:", error);
        return NextResponse.json(
            { error: "Failed to search products" },
            { status: 500 }
        );
    }
}
