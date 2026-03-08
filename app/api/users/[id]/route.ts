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

// GET /api/users/[id] - Get user by ID (own user or admin)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Users can only see their own profile; admins can see all
        if (authUser.role !== UserRole.ADMIN && authUser.id !== id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const user = db.users.findById(id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Remove password from response
        const { password: _pw, ...safeUser } = user;

        // Enrich with role-specific data
        let roleData = {};
        if (user.role === UserRole.BUYER) {
            const buyer = db.buyers.findByUserId(id);
            roleData = { buyer };
        } else if (user.role === UserRole.VENDOR) {
            const vendor = db.vendors.findByUserId(id);
            roleData = { vendor };
        }

        return NextResponse.json({ success: true, user: { ...safeUser, ...roleData } });
    } catch (error) {
        console.error("Get user error:", error);
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
}

// PUT /api/users/[id] - Update user profile (own user or admin)
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

        if (authUser.role !== UserRole.ADMIN && authUser.id !== id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const user = db.users.findById(id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await request.json();

        // Non-admins cannot change roles or active status
        if (authUser.role !== UserRole.ADMIN) {
            delete body.role;
            delete body.isActive;
            delete body.emailVerified;
        }

        // Never allow password change via this endpoint
        delete body.password;
        delete body.resetToken;
        delete body.resetTokenExpiry;

        const updated = db.users.update(id, body);
        if (!updated) {
            return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
        }

        const { password: _pw, ...safeUser } = updated;
        return NextResponse.json({ success: true, user: safeUser });
    } catch (error) {
        console.error("Update user error:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (authUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: "Only admins can delete users" },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Prevent self-deletion
        if (authUser.id === id) {
            return NextResponse.json(
                { error: "You cannot delete your own account" },
                { status: 409 }
            );
        }

        const user = db.users.findById(id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        db.users.delete(id);
        return NextResponse.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
