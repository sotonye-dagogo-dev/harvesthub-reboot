import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import type { Review } from "@/lib/types";

// GET /api/admin/reviews - Get all reviews for moderation
export async function GET(request: NextRequest) {
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

    // Check if user is admin
    if (payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const flaggedOnly = searchParams.get("flagged") === "true";

    // Mock reviews data - will be replaced with database queries
    const mockReviews: Review[] = [
      {
        id: "review-1",
        productId: "prod-1",
        buyerId: "buyer-1",
        orderId: "order-1",
        productName: "Sample Product",
        userName: "John Doe",
        rating: 5,
        comment: "Great product!",
        isFlagged: false,
        isVerifiedPurchase: true,
        helpfulCount: 10,
        notHelpfulCount: 2,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      },
      {
        id: "review-2",
        productId: "prod-2",
        buyerId: "buyer-2",
        orderId: "order-2",
        productName: "Another Product",
        userName: "Jane Smith",
        rating: 1,
        comment: "Terrible experience with inappropriate language",
        isFlagged: true,
        isVerifiedPurchase: true,
        helpfulCount: 0,
        notHelpfulCount: 15,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
      },
    ];

    const reviews = flaggedOnly
      ? mockReviews.filter(r => r.isFlagged)
      : mockReviews;

    return NextResponse.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error("Get admin reviews error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
