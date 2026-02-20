import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { UserRole } from "@/lib/constants";

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest) {
    try {
        const { cookies } = await import("next/headers");
        const { verifyToken } = await import("@/lib/utils/auth");

        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const user = db.users.findById(payload.userId);
        if (!user || user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const role = searchParams.get("role") as UserRole | null;
        const search = searchParams.get("search") || "";
        const isActive = searchParams.get("isActive");
        const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

        let users = db.users.findAll();

        // Filter by role
        if (role) {
            users = users.filter((u) => u.role === role);
        }

        // Filter by active status
        if (isActive !== null) {
            users = users.filter((u) => u.isActive === (isActive === "true"));
        }

        // Search
        if (search) {
            const q = search.toLowerCase();
            users = users.filter(
                (u) =>
                    u.firstName.toLowerCase().includes(q) ||
                    u.lastName.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q) ||
                    u.phoneNumber?.includes(q)
            );
        }

        // Sort by most recent
        users.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Remove passwords from response
        const safeUsers = users.map(({ password: _pw, ...u }) => u);

        // Pagination
        const total = safeUsers.length;
        const totalPages = Math.ceil(total / limit);
        const data = safeUsers.slice((page - 1) * limit, page * limit);

        return NextResponse.json({
            success: true,
            users: data,
            pagination: { total, page, limit, totalPages },
        });
    } catch (error) {
        console.error("Get users error:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
