import { NextRequest, NextResponse } from "next/server";
import { milestoneDb } from "@/lib/data/milestones";
import type { MilestoneType } from "@/lib/types";

const VALID_MILESTONE_TYPES: MilestoneType[] = [
    "FIRST_1000_VENDORS",
    "FIRST_1000_BUYERS",
    "FIRST_PURCHASE",
    "FIRST_SALE",
    "FIRST_REVIEW",
    "VENDOR_100_SALES",
    "CUSTOM",
];

// GET /api/admin/milestones - List all milestones (admin only)
export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const milestoneType = searchParams.get("milestoneType") as MilestoneType | null;
        const userId = searchParams.get("userId");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(
            100,
            Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
        );

        const filters: { milestoneType?: MilestoneType; userId?: string } = {};
        if (milestoneType && VALID_MILESTONE_TYPES.includes(milestoneType)) {
            filters.milestoneType = milestoneType;
        }
        if (userId) {
            filters.userId = userId;
        }

        const allMilestones = milestoneDb.findAll(filters);
        const total = allMilestones.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const data = allMilestones.slice(startIndex, startIndex + limit);

        return NextResponse.json({
            success: true,
            milestones: data,
            pagination: {
                page,
                pageSize: limit,
                total,
                totalPages,
                hasMore: page < totalPages,
            },
        });
    } catch (error) {
        console.error("List milestones error:", error);
        return NextResponse.json(
            { error: "Failed to fetch milestones" },
            { status: 500 }
        );
    }
}

// POST /api/admin/milestones - Create milestone(s) for user(s) (admin only, supports batch)
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { userId, userIds, milestoneType, label, metadata } = body;

        if (!milestoneType || !label) {
            return NextResponse.json(
                { error: "milestoneType and label are required" },
                { status: 400 }
            );
        }

        if (!VALID_MILESTONE_TYPES.includes(milestoneType)) {
            return NextResponse.json(
                {
                    error: `Invalid milestoneType. Must be one of: ${VALID_MILESTONE_TYPES.join(", ")}`,
                },
                { status: 400 }
            );
        }

        // Support batch: userIds array or single userId
        const targetUserIds: string[] = userIds
            ? Array.isArray(userIds)
                ? userIds
                : [userIds]
            : userId
              ? [userId]
              : [];

        if (targetUserIds.length === 0) {
            return NextResponse.json(
                { error: "userId or userIds is required" },
                { status: 400 }
            );
        }

        const created: ReturnType<typeof milestoneDb.create>[] = [];
        const skipped: { userId: string; reason: string }[] = [];

        for (const uid of targetUserIds) {
            const existing = milestoneDb.findByUserAndType(uid, milestoneType);
            if (existing) {
                skipped.push({ userId: uid, reason: "Milestone already exists" });
                continue;
            }

            const milestone = milestoneDb.create({
                userId: uid,
                milestoneType,
                label,
                metadata,
            });
            created.push(milestone);
        }

        return NextResponse.json(
            {
                success: true,
                created,
                skipped,
                message: `Created ${created.length} milestone(s), skipped ${skipped.length}`,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create milestone error:", error);
        return NextResponse.json(
            { error: "Failed to create milestone" },
            { status: 500 }
        );
    }
}
