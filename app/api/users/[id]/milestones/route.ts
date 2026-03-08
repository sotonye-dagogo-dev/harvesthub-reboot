import { NextRequest, NextResponse } from "next/server";
import { milestoneDb } from "@/lib/data/milestones";
import { db } from "@/lib/data/database";

// GET /api/users/[id]/milestones - Get milestones for a specific user
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await (await import("next/headers")).cookies();
        const token = cookieStore.get("accessToken")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { verifyToken } = await import("@/lib/utils/auth");
        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const { id } = await params;

        // Users can view their own milestones; admins can view anyone's
        if (payload.userId !== id && payload.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const user = db.users.findById(id);
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const milestones = milestoneDb.findByUserId(id);

        return NextResponse.json({
            success: true,
            milestones,
            total: milestones.length,
        });
    } catch (error) {
        console.error("Get user milestones error:", error);
        return NextResponse.json(
            { error: "Failed to fetch milestones" },
            { status: 500 }
        );
    }
}
