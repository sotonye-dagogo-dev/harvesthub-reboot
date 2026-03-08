import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";

// GET /api/banners - Get active banners
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get("active") === "true";

        let banners = await db.banners.findAll();

        if (activeOnly) {
            const now = new Date();
            banners = banners.filter((banner) => {
                const isActive = banner.isActive;
                const isInDateRange =
                    (!banner.startDate || new Date(banner.startDate) <= now) &&
                    (!banner.endDate || new Date(banner.endDate) >= now);

                return isActive && isInDateRange;
            });
        }

        // Sort by order/priority
        banners.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        return NextResponse.json({ success: true, banners });
    } catch (error) {
        console.error("Get banners error:", error);
        return NextResponse.json(
            { error: "Failed to fetch banners" },
            { status: 500 }
        );
    }
}

// POST /api/banners - Create banner (admin only)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            title,
            description,
            imageUrl,
            linkUrl,
            startDate,
            endDate,
            order,
            isActive,
            position,
        } = body;

        if (!title || !imageUrl) {
            return NextResponse.json(
                { error: "Title and image URL are required" },
                { status: 400 }
            );
        }

        const banner = await db.banners.create({
            title,
            description,
            imageUrl,
            linkUrl,
            position: position || 'HERO',
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            displayOrder: order || 0,
            isActive: isActive !== undefined ? isActive : true,
            clickCount: 0,
            impressionCount: 0,
            targetAudience: null,
            createdBy: 'system',
        });

        return NextResponse.json({
            success: true,
            message: "Banner created successfully",
            banner
        }, { status: 201 });
    } catch (error) {
        console.error("Create banner error:", error);
        return NextResponse.json(
            { error: "Failed to create banner" },
            { status: 500 }
        );
    }
}
