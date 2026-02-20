import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";

// GET /api/products/[id]/reviews - Get reviews for a product
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = db.products.findById(id);

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const reviews = db.reviews.findAll({ productId: id });

        return NextResponse.json({
            success: true,
            reviews,
            averageRating: product.averageRating || 0,
            totalReviews: product.totalReviews || 0,
        });
    } catch (error) {
        console.error("Get product reviews error:", error);
        return NextResponse.json(
            { error: "Failed to fetch reviews" },
            { status: 500 }
        );
    }
}

// POST /api/products/[id]/reviews - Create a review (buyer only)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { cookies } = await import("next/headers");
        const { verifyToken } = await import("@/lib/utils/auth");

        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const { id } = await params;
        const product = db.products.findById(id);

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Verify buyer
        const buyer = db.buyers.findByUserId(payload.userId);
        if (!buyer) {
            return NextResponse.json({ error: "Only buyers can leave reviews" }, { status: 403 });
        }

        // Check for existing review
        const existingReviews = db.reviews.findAll({ productId: id, buyerId: buyer.id });
        if (existingReviews.length > 0) {
            return NextResponse.json(
                { error: "You have already reviewed this product" },
                { status: 409 }
            );
        }

        const body = await request.json();
        const review = db.reviews.create({
            productId: id,
            buyerId: buyer.id,
            rating: body.rating,
            title: body.title || "",
            comment: body.comment || "",
            images: body.images || [],
            isVerifiedPurchase: body.isVerifiedPurchase ?? false,
            helpfulCount: 0,
        });

        return NextResponse.json({ success: true, review }, { status: 201 });
    } catch (error) {
        console.error("Create review error:", error);
        return NextResponse.json(
            { error: "Failed to create review" },
            { status: 500 }
        );
    }
}
