import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import { bugReportDb } from "@/lib/data/bugReports";
import { uploadImage } from "@/lib/utils/cloudinary";
import type { BugReportCategoryValue, BugReportPriorityValue, BugReportStatusValue } from "@/lib/types";

const VALID_CATEGORIES: BugReportCategoryValue[] = ['UI_ISSUE', 'PAYMENT', 'ORDER', 'ACCOUNT', 'PERFORMANCE', 'OTHER'];
const VALID_PRIORITIES: BugReportPriorityValue[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const VALID_STATUSES: BugReportStatusValue[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

// GET /api/bug-reports — List bug reports (admin only)
export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        if (!token) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload || payload.role !== "ADMIN") {
            return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") as BugReportStatusValue | null;
        const category = searchParams.get("category") as BugReportCategoryValue | null;
        const priority = searchParams.get("priority") as BugReportPriorityValue | null;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const filters: {
            status?: BugReportStatusValue;
            category?: BugReportCategoryValue;
            priority?: BugReportPriorityValue;
        } = {};

        if (status && VALID_STATUSES.includes(status)) filters.status = status;
        if (category && VALID_CATEGORIES.includes(category)) filters.category = category;
        if (priority && VALID_PRIORITIES.includes(priority)) filters.priority = priority;

        const allReports = bugReportDb.getAll(filters);
        const total = allReports.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const reports = allReports.slice(startIndex, startIndex + limit);
        const stats = bugReportDb.getStats();

        return NextResponse.json({
            success: true,
            reports,
            stats,
            pagination: { page, limit, total, totalPages },
        });
    } catch {
        return NextResponse.json({ success: false, error: "Failed to fetch bug reports" }, { status: 500 });
    }
}

// POST /api/bug-reports — Submit a bug report (auth optional)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { category, priority, subject, details, email, screenshot } = body;

        // Validate required fields
        if (!category || !VALID_CATEGORIES.includes(category)) {
            return NextResponse.json({ success: false, error: "Valid category is required" }, { status: 400 });
        }
        if (!priority || !VALID_PRIORITIES.includes(priority)) {
            return NextResponse.json({ success: false, error: "Valid priority is required" }, { status: 400 });
        }
        if (!subject || typeof subject !== "string" || subject.trim().length < 5) {
            return NextResponse.json({ success: false, error: "Subject must be at least 5 characters" }, { status: 400 });
        }
        if (!details || typeof details !== "string" || details.trim().length < 20) {
            return NextResponse.json({ success: false, error: "Details must be at least 20 characters" }, { status: 400 });
        }
        if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ success: false, error: "Valid email is required" }, { status: 400 });
        }

        // Check if user is authenticated (optional)
        let userId: string | null = null;
        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;
        if (token) {
            const payload = await verifyToken(token);
            if (payload) userId = payload.userId;
        }

        // Handle screenshot upload if provided
        let screenshotUrl: string | null = null;
        let screenshotPublicId: string | null = null;
        if (screenshot && typeof screenshot === "string") {
            const uploadResult = await uploadImage(screenshot, "bugs");
            screenshotUrl = uploadResult.url;
            screenshotPublicId = uploadResult.publicId;
        }

        const report = bugReportDb.create({
            category,
            priority,
            subject: subject.trim(),
            details: details.trim(),
            email: email.trim().toLowerCase(),
            userId,
            screenshotUrl,
            screenshotPublicId,
        });

        return NextResponse.json({ success: true, report }, { status: 201 });
    } catch {
        return NextResponse.json({ success: false, error: "Failed to submit bug report" }, { status: 500 });
    }
}
