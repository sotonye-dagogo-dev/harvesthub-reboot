import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import type { Notification } from "@/lib/types";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Mock notifications storage (using let for mutability in mock backend)
// eslint-disable-next-line prefer-const
let mockNotifications: Notification[] = [];

// DELETE /api/notifications/[id] - Delete notification
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
    const index = mockNotifications.findIndex(n => n.id === id && n.userId === payload.userId);

    if (index === -1) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    // Delete notification
    mockNotifications.splice(index, 1);

    return NextResponse.json({
      success: true,
      message: "Notification deleted"
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
