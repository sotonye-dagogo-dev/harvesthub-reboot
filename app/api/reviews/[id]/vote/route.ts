import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Mock review votes storage (using let for mutability in mock backend)
// eslint-disable-next-line prefer-const
let mockReviewVotes: { reviewId: string; userId: string; helpful: boolean }[] = [];

// POST /api/reviews/[id]/vote - Vote on review helpfulness
export async function POST(
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
    const body = await request.json();
    const { helpful } = body;

    if (typeof helpful !== "boolean") {
      return NextResponse.json(
        { error: "Invalid vote value" },
        { status: 400 }
      );
    }

    // Check if user already voted
    const existingVoteIndex = mockReviewVotes.findIndex(
      v => v.reviewId === id && v.userId === payload.userId
    );

    if (existingVoteIndex >= 0) {
      // Update existing vote (index is valid since >= 0)
      mockReviewVotes[existingVoteIndex]!.helpful = helpful;
    } else {
      // Add new vote
      mockReviewVotes.push({
        reviewId: id,
        userId: payload.userId,
        helpful,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Vote recorded"
    });
  } catch (error) {
    console.error("Review vote error:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}
