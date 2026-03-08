import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import { db } from "@/lib/data/database";
import { proofOfTransferDb } from "@/lib/data/proofOfTransfers";
import { TransactionStatus } from "@/lib/constants";
import type { Transaction } from "@/lib/types";

// GET /api/admin/payments/[id] - Get single payment proof detail (admin)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const proof = proofOfTransferDb.getById(id);

    if (!proof) {
      return NextResponse.json(
        { error: "Payment proof not found" },
        { status: 404 }
      );
    }

    // Enrich with user info
    const user = db.users.findById(proof.userId);

    return NextResponse.json({
      success: true,
      proof: {
        ...proof,
        user: user
          ? { id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email }
          : null,
      },
    });
  } catch (error) {
    console.error("Admin get payment detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment proof" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/payments/[id] - Admin verify or reject payment proof
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { action, notes } = body as { action: string; notes?: string };

    if (!action || !["verify", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'verify' or 'reject'" },
        { status: 400 }
      );
    }

    const proof = proofOfTransferDb.getById(id);
    if (!proof) {
      return NextResponse.json(
        { error: "Payment proof not found" },
        { status: 404 }
      );
    }

    if (proof.status !== "PENDING") {
      return NextResponse.json(
        { error: `Payment proof already ${proof.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    if (action === "verify") {
      // Update proof status
      const updatedProof = proofOfTransferDb.update(id, {
        status: "VERIFIED",
        verifiedBy: payload.userId,
        verifiedAt: new Date().toISOString(),
        notes: notes || undefined,
      });

      // Credit the user's wallet
      const wallet = db.wallets.findByUserId(proof.userId);
      if (wallet) {
        db.wallets.updateBalance(wallet.id, wallet.balance + proof.amount);

        // Find and complete the pending transaction
        const allTransactions = db.transactions.findAll({ walletId: wallet.id });
        const txnList = Array.isArray(allTransactions)
          ? allTransactions
          : allTransactions.data;
        const pendingTxn = txnList.find(
          (t: Transaction) =>
            t.status === TransactionStatus.PENDING &&
            t.metadata &&
            (t.metadata as Record<string, unknown>).proofOfTransferId === id
        );
        if (pendingTxn) {
          db.transactions.updateStatus(pendingTxn.id, TransactionStatus.COMPLETED);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Payment verified and wallet credited",
        proof: updatedProof,
      });
    }

    // Reject
    const updatedProof = proofOfTransferDb.update(id, {
      status: "REJECTED",
      verifiedBy: payload.userId,
      verifiedAt: new Date().toISOString(),
      notes: notes || "Payment proof rejected",
    });

    // Mark the pending transaction as failed
    const wallet = db.wallets.findByUserId(proof.userId);
    if (wallet) {
      const allTransactions = db.transactions.findAll({ walletId: wallet.id });
      const txnList = Array.isArray(allTransactions)
        ? allTransactions
        : allTransactions.data;
      const pendingTxn = txnList.find(
        (t: Transaction) =>
          t.status === TransactionStatus.PENDING &&
          t.metadata &&
          (t.metadata as Record<string, unknown>).proofOfTransferId === id
      );
      if (pendingTxn) {
        db.transactions.updateStatus(pendingTxn.id, TransactionStatus.FAILED);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment proof rejected",
      proof: updatedProof,
    });
  } catch (error) {
    console.error("Admin verify/reject payment error:", error);
    return NextResponse.json(
      { error: "Failed to process payment proof" },
      { status: 500 }
    );
  }
}
