import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";

// In-memory store (will be replaced with database in production)
const subscriptions = new Map<string, { endpoint: string; keys: { p256dh: string; auth: string } }>();

// POST /api/push/subscribe - Store push subscription for the authenticated user
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

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Missing required subscription fields (endpoint, keys.p256dh, keys.auth)" },
        { status: 400 }
      );
    }

    subscriptions.set(payload.userId, { endpoint, keys });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to store push subscription" },
      { status: 500 }
    );
  }
}
