import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// PUT /api/admin/reviews/[id]/flag - Flag/unflag a review (admin only)
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

    // Check if user is admin
    if (payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // In production, update in database
    // For now, just return success (TODO: implement flagging logic with id)
    console.log("Flagging review:", id);

    return NextResponse.json({
      success: true,
      message: "Review flagged successfully"
    });
  } catch (error) {
    console.error("Flag review error:", error);
    return NextResponse.json(
      { error: "Failed to flag review" },
      { status: 500 }
    );
  }
}
