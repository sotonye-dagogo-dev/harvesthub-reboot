import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import { TransactionType, TransactionStatus } from "@/lib/constants";

// GET /api/wallet/transactions - Get user's transaction history
export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const type = searchParams.get("type") as TransactionType | null;
        const status = searchParams.get("status") as TransactionStatus | null;

        // Use findAll with proper filters
        const result = db.transactions.findAll({
            walletId: wallet.id,
            type: type || undefined,
            status: status || undefined,
            page,
            limit,
        });

        // Check if result is paginated or array
        const filtered = Array.isArray(result) ? result : result.data;

        // Handle pagination
        if (Array.isArray(result)) {
            const total = filtered.length;
            const totalPages = Math.ceil(total / limit);

            return NextResponse.json({
                success: true,
                transactions: filtered,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasMore: page < totalPages,
                }
            });
        } else {
            return NextResponse.json({
                success: true,
                transactions: result.data,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages,
                    hasMore: result.page < result.totalPages,
                }
            });
        }
    } catch (error) {
        console.error("Get transactions error:", error);
        return NextResponse.json(
            { error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}
