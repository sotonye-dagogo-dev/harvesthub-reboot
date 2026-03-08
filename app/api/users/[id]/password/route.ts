import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { UserRole } from "@/lib/constants";

async function getAuthUser(_request: NextRequest) {
    const { cookies } = await import("next/headers");
    const { verifyToken } = await import("@/lib/utils/auth");
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    if (!payload) return null;
    return db.users.findById(payload.userId);
}

// PUT /api/users/[id]/password - Change user password
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Only the user themselves or an admin can change the password
        if (authUser.role !== UserRole.ADMIN && authUser.id !== id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const user = db.users.findById(id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!newPassword || newPassword.length < 8) {
            return NextResponse.json(
                { error: "New password must be at least 8 characters" },
                { status: 400 }
            );
        }

        // Non-admin users must provide their current password
        if (authUser.role !== UserRole.ADMIN) {
            if (!currentPassword) {
                return NextResponse.json(
                    { error: "Current password is required" },
                    { status: 400 }
                );
            }

            const isValid = db.users.verifyPassword(id, currentPassword);
            if (!isValid) {
                return NextResponse.json(
                    { error: "Current password is incorrect" },
                    { status: 400 }
                );
            }
        }

        const updated = db.users.updatePassword(id, newPassword);
        if (!updated) {
            return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Password updated successfully",
        });
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
    }
}
