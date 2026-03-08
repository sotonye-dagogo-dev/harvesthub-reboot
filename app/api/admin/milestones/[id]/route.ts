import { NextRequest, NextResponse } from "next/server";
import { milestoneDb } from "@/lib/data/milestones";

// GET /api/admin/milestones/[id] - Get single milestone detail (admin only)
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
        if (!payload || payload.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const milestone = milestoneDb.findById(id);

        if (!milestone) {
            return NextResponse.json(
                { error: "Milestone not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, milestone });
    } catch (error) {
        console.error("Get milestone error:", error);
        return NextResponse.json(
            { error: "Failed to fetch milestone" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/milestones/[id] - Remove a milestone (admin only)
export async function DELETE(
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
        if (!payload || payload.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const milestone = milestoneDb.findById(id);

        if (!milestone) {
            return NextResponse.json(
                { error: "Milestone not found" },
                { status: 404 }
            );
        }

        const deleted = milestoneDb.delete(id);
        if (!deleted) {
            return NextResponse.json(
                { error: "Failed to delete milestone" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Milestone deleted successfully",
        });
    } catch (error) {
        console.error("Delete milestone error:", error);
        return NextResponse.json(
            { error: "Failed to delete milestone" },
            { status: 500 }
        );
    }
}
