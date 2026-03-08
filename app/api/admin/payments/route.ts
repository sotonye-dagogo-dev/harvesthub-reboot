import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import { proofOfTransferDb } from "@/lib/data/proofOfTransfers";

// GET /api/admin/payments - List all payment proofs (admin only)
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

    if (payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as
      | "PENDING"
      | "VERIFIED"
      | "REJECTED"
      | null;

    const proofs = status
      ? proofOfTransferDb.getByStatus(status)
      : proofOfTransferDb.getAll();

    return NextResponse.json({
      success: true,
      proofs,
      total: proofs.length,
    });
  } catch (error) {
    console.error("Admin list payments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment proofs" },
      { status: 500 }
    );
  }
}
