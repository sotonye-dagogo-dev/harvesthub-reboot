import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET /api/banners/[id] - Get banner by ID
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const banner = await db.banners.findById(id);

        if (!banner) {
            return NextResponse.json({ error: "Banner not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, banner });
    } catch (error) {
        console.error("Get banner error:", error);
        return NextResponse.json(
            { error: "Failed to fetch banner" },
            { status: 500 }
        );
    }
}

// PUT /api/banners/[id] - Update banner (admin only)
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const banner = await db.banners.findById(id);

        if (!banner) {
            return NextResponse.json({ error: "Banner not found" }, { status: 404 });
        }

        const updatedBanner = await db.banners.update(id, {
            ...body,
            startDate: body.startDate ? new Date(body.startDate) : banner.startDate,
            endDate: body.endDate ? new Date(body.endDate) : banner.endDate,
        });

        return NextResponse.json({
            success: true,
            message: "Banner updated successfully",
            banner: updatedBanner
        });
    } catch (error) {
        console.error("Update banner error:", error);
        return NextResponse.json(
            { error: "Failed to update banner" },
            { status: 500 }
        );
    }
}

// DELETE /api/banners/[id] - Delete banner (admin only)
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const banner = await db.banners.findById(id);

        if (!banner) {
            return NextResponse.json({ error: "Banner not found" }, { status: 404 });
        }

        await db.banners.delete(id);

        return NextResponse.json({
            success: true,
            message: "Banner deleted successfully"
        });
    } catch (error) {
        console.error("Delete banner error:", error);
        return NextResponse.json(
            { error: "Failed to delete banner" },
            { status: 500 }
        );
    }
}

// PATCH /api/banners/[id] - Track banner click
export async function PATCH(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const banner = await db.banners.findById(id);

        if (!banner) {
            return NextResponse.json({ error: "Banner not found" }, { status: 404 });
        }

        // Increment clicks
        db.banners.incrementClicks(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Track banner click error:", error);
        return NextResponse.json(
            { error: "Failed to track click" },
            { status: 500 }
        );
    }
}
