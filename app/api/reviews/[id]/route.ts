import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET /api/reviews/[id] - Get review by ID
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const review = await db.reviews.findById(id);

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, review });
    } catch (error) {
        console.error("Get review error:", error);
        return NextResponse.json(
            { error: "Failed to fetch review" },
            { status: 500 }
        );
    }
}

// PUT /api/reviews/[id] - Update review
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
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

        const { id } = await params;
        const review = await db.reviews.findById(id);

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        // Get buyer to check ownership
        const buyer = await db.buyers.findByUserId(payload.userId);
        if (!buyer) {
            return NextResponse.json({ error: "Buyer profile not found" }, { status: 404 });
        }

        // Only the review author can update
        if (review.buyerId !== buyer.id) {
            return NextResponse.json(
                { error: "You can only update your own reviews" },
                { status: 403 }
            );
        }

        const { rating, comment, images } = await request.json();

        if (rating && (rating < 1 || rating > 5)) {
            return NextResponse.json(
                { error: "Rating must be between 1 and 5" },
                { status: 400 }
            );
        }

        const updatedReview = await db.reviews.update(id, {
            rating: rating || review.rating,
            comment: comment !== undefined ? comment : review.comment,
            images: images || review.images,
            updatedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            message: "Review updated successfully",
            review: updatedReview
        });
    } catch (error) {
        console.error("Update review error:", error);
        return NextResponse.json(
            { error: "Failed to update review" },
            { status: 500 }
        );
    }
}

// DELETE /api/reviews/[id] - Delete review
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
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

        const { id } = await params;
        const review = await db.reviews.findById(id);

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        // Get buyer to check ownership
        const buyer = await db.buyers.findByUserId(payload.userId);

        // Only the review author or admin can delete
        if (buyer && review.buyerId !== buyer.id && payload.role !== "ADMIN") {
            return NextResponse.json(
                { error: "You can only delete your own reviews" },
                { status: 403 }
            );
        }

        if (!buyer && payload.role !== "ADMIN") {
            return NextResponse.json({ error: "Buyer profile not found" }, { status: 404 });
        }

        await db.reviews.delete(id);

        return NextResponse.json({
            success: true,
            message: "Review deleted successfully"
        });
    } catch (error) {
        console.error("Delete review error:", error);
        return NextResponse.json(
            { error: "Failed to delete review" },
            { status: 500 }
        );
    }
}
