import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";

interface NotificationPreferences {
  userId: string;
  orderConfirmed: boolean;
  orderReady: boolean;
  orderDelivered: boolean;
  orderCancelled: boolean;
  paymentSuccess: boolean;
  paymentFailed: boolean;
  deliveryUpdates: boolean;
  vendorMessages: boolean;
  lowStock: boolean;
  newProducts: boolean;
  promotions: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

// Mock preferences storage (using let for mutability in mock backend)
// eslint-disable-next-line prefer-const
let mockPreferences: NotificationPreferences[] = [];

// GET /api/notifications/preferences - Get user's notification preferences
export async function GET() {
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

    // Find or create preferences
    let preferences = mockPreferences.find(p => p.userId === payload.userId);

    if (!preferences) {
      // Create default preferences
      preferences = {
        userId: payload.userId,
        orderConfirmed: true,
        orderReady: true,
        orderDelivered: true,
        orderCancelled: true,
        paymentSuccess: true,
        paymentFailed: true,
        deliveryUpdates: true,
        vendorMessages: true,
        lowStock: true,
        newProducts: false,
        promotions: false,
        emailNotifications: true,
        smsNotifications: false,
      };
      mockPreferences.push(preferences);
    }

    return NextResponse.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update notification preferences
export async function PUT(request: NextRequest) {
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

    // Find or create preferences
    const index = mockPreferences.findIndex(p => p.userId === payload.userId);

    if (index !== -1) {
      mockPreferences[index] = { userId: payload.userId, ...body };
    } else {
      mockPreferences.push({ userId: payload.userId, ...body });
    }

    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully"
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
