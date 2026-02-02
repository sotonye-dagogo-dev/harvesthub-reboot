import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import { TransactionType, TransactionStatus } from "@/lib/constants";

// POST /api/wallet/withdraw - Request withdrawal
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

        // Only vendors can withdraw
        if (payload.role !== "VENDOR") {
            return NextResponse.json(
                { error: "Only vendors can withdraw funds" },
                { status: 403 }
            );
        }

        const { amount, bankName, accountNumber, accountName } = await request.json();

        if (!amount || amount < 1000) {
            return NextResponse.json(
                { error: "Minimum withdrawal amount is ₦1,000" },
                { status: 400 }
            );
        }

        if (!bankName || !accountNumber || !accountName) {
            return NextResponse.json(
                { error: "Bank details are required" },
                { status: 400 }
            );
        }

        const wallet = await db.wallets.findByUserId(payload.userId);

        if (!wallet) {
            return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
        }

        if (wallet.balance < amount) {
            return NextResponse.json(
                { error: "Insufficient balance" },
                { status: 400 }
            );
        }

        // Create withdrawal transaction
        const transaction = await db.transactions.create({
            walletId: wallet.id,
            type: TransactionType.WITHDRAWAL,
            amount,
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance - amount,
            status: TransactionStatus.PENDING,
            description: `Withdrawal to ${bankName} - ${accountNumber}`,
            reference: `WD-${Date.now()}`,
            metadata: {
                bankName,
                accountNumber,
                accountName,
            },
        });

        // Deduct from wallet balance
        await db.wallets.updateBalance(wallet.id, wallet.balance - amount);

        const updatedWallet = await db.wallets.findById(wallet.id);

        return NextResponse.json({
            success: true,
            message: "Withdrawal request submitted. Pending admin approval.",
            transaction,
            wallet: updatedWallet
        });
    } catch (error) {
        console.error("Withdrawal error:", error);
        return NextResponse.json(
            { error: "Failed to process withdrawal" },
            { status: 500 }
        );
    }
}
