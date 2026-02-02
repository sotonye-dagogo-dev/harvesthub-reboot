import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";

// GET /api/reviews - Get reviews (with filters)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");
        const vendorId = searchParams.get("vendorId");
        const rating = searchParams.get("rating");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        let reviews = await db.reviews.findAll();

        // Filter by product
        if (productId) {
            reviews = reviews.filter((r) => r.productId === productId);
        }

        // Filter by vendor - need to get products first
        if (vendorId) {
            const vendorProducts = await db.products.findAll({ vendorId });
            const vendorProductIds = Array.isArray(vendorProducts)
                ? vendorProducts.map((p) => p.id)
                : vendorProducts.data.map((p) => p.id);
            reviews = reviews.filter((r) => vendorProductIds.includes(r.productId));
        }

        // Filter by rating
        if (rating) {
            reviews = reviews.filter((r) => r.rating === parseInt(rating));
        }

        // Sort by date (newest first)
        reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Pagination
        const total = reviews.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const paginatedReviews = reviews.slice(startIndex, startIndex + limit);

        // Calculate average rating if filtering by product/vendor
        let averageRating = 0;
        if (reviews.length > 0) {
            const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
            averageRating = sum / reviews.length;
        }

        return NextResponse.json({
            success: true,
            reviews: paginatedReviews,
            averageRating: parseFloat(averageRating.toFixed(1)),
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasMore: page < totalPages,
            }
        });
    } catch (error) {
        console.error("Get reviews error:", error);
        return NextResponse.json(
            { error: "Failed to fetch reviews" },
            { status: 500 }
        );
    }
}

// POST /api/reviews - Create review
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const { productId, orderId, rating, comment, images } = await request.json();

        if (!productId || !orderId || !rating) {
            return NextResponse.json(
                { error: "Product ID, Order ID, and rating are required" },
                { status: 400 }
            );
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: "Rating must be between 1 and 5" },
                { status: 400 }
            );
        }

        // Get product to get vendor ID
        const product = await db.products.findById(productId);
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Get buyer for the review
        const buyer = await db.buyers.findByUserId(payload.userId);
        if (!buyer) {
            return NextResponse.json({ error: "Buyer profile not found" }, { status: 404 });
        }

        // Check if user has already reviewed this product for this order
        const existingReviews = db.reviews.findAll({ productId, buyerId: buyer.id });
        const existingReview = existingReviews.find((r) => r.orderId === orderId);
        if (existingReview) {
            return NextResponse.json(
                { error: "You have already reviewed this product" },
                { status: 400 }
            );
        }

        const review = await db.reviews.create({
            productId,
            buyerId: buyer.id,
            orderId,
            rating,
            comment,
            images: images || [],
            isVerifiedPurchase: true,
            helpfulCount: 0,
            notHelpfulCount: 0,
        });

        return NextResponse.json({
            success: true,
            message: "Review submitted successfully",
            review
        }, { status: 201 });
    } catch (error) {
        console.error("Create review error:", error);
        return NextResponse.json(
            { error: "Failed to create review" },
            { status: 500 }
        );
    }
}
