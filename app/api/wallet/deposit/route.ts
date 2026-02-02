import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import { TransactionType, TransactionStatus } from "@/lib/constants";

// POST /api/wallet/deposit - Deposit funds to wallet
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

        const { amount } = await request.json();

        if (!amount || amount < 100) {
            return NextResponse.json(
                { error: "Minimum deposit amount is ₦100" },
                { status: 400 }
            );
        }

        const wallet = await db.wallets.findByUserId(payload.userId);

        if (!wallet) {
            return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
        }

        // Create deposit transaction
        const transaction = await db.transactions.create({
            walletId: wallet.id,
            type: TransactionType.DEPOSIT,
            amount,
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance + amount,
            status: TransactionStatus.COMPLETED,
            description: `Wallet deposit`,
            reference: `DEP-${Date.now()}`,
        });

        // Update wallet balance
        await db.wallets.updateBalance(wallet.id, wallet.balance + amount);

        const updatedWallet = await db.wallets.findById(wallet.id);

        return NextResponse.json({
            success: true,
            message: "Deposit successful",
            transaction,
            wallet: updatedWallet
        });
    } catch (error) {
        console.error("Deposit error:", error);
        return NextResponse.json(
            { error: "Failed to process deposit" },
            { status: 500 }
        );
    }
}
