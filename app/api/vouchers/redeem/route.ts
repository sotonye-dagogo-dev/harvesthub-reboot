import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import { voucherDb, redemptionDb } from "@/lib/data/vouchers";

// POST /api/vouchers/redeem - Apply voucher to order (buyer)
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
    const { code, orderId, orderAmount } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, discountApplied: 0, error: "Voucher code is required" },
        { status: 400 }
      );
    }

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { success: false, discountApplied: 0, error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (!orderAmount || typeof orderAmount !== "number" || orderAmount <= 0) {
      return NextResponse.json(
        { success: false, discountApplied: 0, error: "Valid order amount is required" },
        { status: 400 }
      );
    }

    const voucher = voucherDb.findByCode(code);

    if (!voucher) {
      return NextResponse.json(
        { success: false, discountApplied: 0, error: "Invalid voucher code" },
        { status: 400 }
      );
    }

    // Validate voucher is still usable
    if (!voucher.isActive) {
      return NextResponse.json(
        { success: false, discountApplied: 0, error: "This voucher is no longer active" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now < new Date(voucher.validFrom) || now > new Date(voucher.validTo)) {
      return NextResponse.json(
        { success: false, discountApplied: 0, error: "This voucher has expired" },
        { status: 400 }
      );
    }

    if (voucher.usageLimit !== undefined && voucher.usedCount >= voucher.usageLimit) {
      return NextResponse.json(
        { success: false, discountApplied: 0, error: "This voucher has reached its usage limit" },
        { status: 400 }
      );
    }

    const userRedemptions = redemptionDb.findByVoucherAndUser(
      voucher.id,
      payload.userId
    );
    if (userRedemptions.length >= voucher.perUserLimit) {
      return NextResponse.json(
        {
          success: false,
          discountApplied: 0,
          error: "You have already used this voucher the maximum number of times",
        },
        { status: 400 }
      );
    }

    if (orderAmount < voucher.minOrderAmount) {
      return NextResponse.json(
        {
          success: false,
          discountApplied: 0,
          error: `Minimum order amount is ₦${voucher.minOrderAmount.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    // Calculate discount
    const discountApplied = calculateDiscount(
      voucher.type,
      voucher.value,
      orderAmount,
      voucher.maxDiscount
    );

    // Atomic: increment usage + create redemption record
    voucherDb.incrementUsedCount(voucher.id);

    const redemption = redemptionDb.create({
      voucherId: voucher.id,
      userId: payload.userId,
      orderId,
      discountApplied,
    });

    return NextResponse.json({
      success: true,
      discountApplied,
      redemptionId: redemption.id,
      voucherType: voucher.type,
      message:
        voucher.type === "FREE_DELIVERY"
          ? "Free delivery applied to your order!"
          : `₦${discountApplied.toLocaleString()} discount applied to your order`,
    });
  } catch (error) {
    console.error("Redeem voucher error:", error);
    return NextResponse.json(
      { success: false, discountApplied: 0, error: "Failed to redeem voucher" },
      { status: 500 }
    );
  }
}

function calculateDiscount(
  type: string,
  value: number,
  orderAmount: number,
  maxDiscount?: number
): number {
  let discount = 0;

  switch (type) {
    case "PERCENTAGE":
      discount = Math.round((orderAmount * value) / 100);
      break;
    case "FIXED_AMOUNT":
      discount = value;
      break;
    case "FREE_DELIVERY":
      discount = 0;
      break;
    default:
      discount = 0;
  }

  if (discount > orderAmount) {
    discount = orderAmount;
  }

  if (maxDiscount && discount > maxDiscount) {
    discount = maxDiscount;
  }

  return discount;
}
