import { NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";

// GET /api/wallet - Get user's wallet
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const wallet = await db.wallets.findByUserId(payload.userId);

        if (!wallet) {
            return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, wallet });
    } catch (error) {
        console.error("Get wallet error:", error);
        return NextResponse.json(
            { error: "Failed to fetch wallet" },
            { status: 500 }
        );
    }
}
