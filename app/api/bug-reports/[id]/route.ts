import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import { bugReportDb } from "@/lib/data/bugReports";
import type { BugReportStatusValue } from "@/lib/types";

const VALID_STATUSES: BugReportStatusValue[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

// GET /api/bug-reports/[id] — Get a single bug report (admin only)
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const report = bugReportDb.getById(id);

        if (!report) {
            return NextResponse.json({ success: false, error: "Bug report not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, report });
    } catch {
        return NextResponse.json({ success: false, error: "Failed to fetch bug report" }, { status: 500 });
    }
}

// PATCH /api/bug-reports/[id] — Update bug report status/notes (admin only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const body = await request.json();
        const { status, adminNotes } = body;

        const existing = bugReportDb.getById(id);
        if (!existing) {
            return NextResponse.json({ success: false, error: "Bug report not found" }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {};

        if (status) {
            if (!VALID_STATUSES.includes(status)) {
                return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
            }
            updateData.status = status;

            if (status === 'RESOLVED' || status === 'CLOSED') {
                updateData.resolvedBy = payload.userId;
                updateData.resolvedAt = new Date().toISOString();
            }
        }

        if (adminNotes !== undefined) {
            updateData.adminNotes = typeof adminNotes === "string" ? adminNotes.trim() : null;
        }

        const updated = bugReportDb.update(id, updateData);

        if (!updated) {
            return NextResponse.json({ success: false, error: "Failed to update bug report" }, { status: 500 });
        }

        return NextResponse.json({ success: true, report: updated });
    } catch {
        return NextResponse.json({ success: false, error: "Failed to update bug report" }, { status: 500 });
    }
}
