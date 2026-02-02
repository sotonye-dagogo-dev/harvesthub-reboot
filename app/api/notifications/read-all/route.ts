import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import type { Notification } from "@/lib/types";

// Mock notifications storage (using let for mutability in mock backend)
// eslint-disable-next-line prefer-const
let mockNotifications: Notification[] = [];

// PUT /api/notifications/read-all - Mark all notifications as read
export async function PUT() {
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

    // Mark all user's notifications as read
    mockNotifications = mockNotifications.map(n =>
      n.userId === payload.userId
        ? { ...n, isRead: true, updatedAt: new Date() }
        : n
    );

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    return NextResponse.json(
      { error: "Failed to mark all as read" },
      { status: 500 }
    );
  }
}
