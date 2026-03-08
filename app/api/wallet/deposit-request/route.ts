import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import { db } from "@/lib/data/database";
import { proofOfTransferDb } from "@/lib/data/proofOfTransfers";
import { TransactionType, TransactionStatus } from "@/lib/constants";

// POST /api/wallet/deposit-request - Create wallet deposit request via bank transfer
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { amount, bankReference, proofImageUrl, proofImagePublicId, orderId } = body;

    if (!amount || typeof amount !== "number" || amount < 100) {
      return NextResponse.json(
        { error: "Minimum deposit amount is ₦100" },
        { status: 400 }
      );
    }

    if (!proofImageUrl) {
      return NextResponse.json(
        { error: "Proof of transfer image is required" },
        { status: 400 }
      );
    }

    const wallet = db.wallets.findByUserId(payload.userId);
    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Create proof-of-transfer record
    const proof = proofOfTransferDb.create({
      userId: payload.userId,
      orderId: orderId || undefined,
      imageUrl: proofImageUrl,
      imagePublicId: proofImagePublicId || undefined,
      bankReference: bankReference || undefined,
      amount,
      status: "PENDING",
    });

    // Create a pending deposit transaction
    const transaction = db.transactions.create({
      walletId: wallet.id,
      type: TransactionType.DEPOSIT,
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance,
      status: TransactionStatus.PENDING,
      description: "Bank transfer deposit (pending verification)",
      reference: `BT-${Date.now()}`,
      metadata: {
        proofOfTransferId: proof.id,
        bankReference: bankReference || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Deposit request submitted. Awaiting admin verification.",
      proof,
      transaction,
    });
  } catch (error) {
    console.error("Deposit request error:", error);
    return NextResponse.json(
      { error: "Failed to create deposit request" },
      { status: 500 }
    );
  }
}
