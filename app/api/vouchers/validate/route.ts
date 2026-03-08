import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import { voucherDb, redemptionDb } from "@/lib/data/vouchers";

// POST /api/vouchers/validate - Buyer validates voucher code
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
    const { code, orderAmount, vendorId, categories } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, discount: 0, message: "Voucher code is required" },
        { status: 400 }
      );
    }

    if (!orderAmount || typeof orderAmount !== "number" || orderAmount <= 0) {
      return NextResponse.json(
        { valid: false, discount: 0, message: "Valid order amount is required" },
        { status: 400 }
      );
    }

    const voucher = voucherDb.findByCode(code);

    if (!voucher) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        message: "Invalid voucher code",
      });
    }

    // Check active
    if (!voucher.isActive) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        message: "This voucher is no longer active",
      });
    }

    // Check dates
    const now = new Date();
    if (now < new Date(voucher.validFrom)) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        message: "This voucher is not yet valid",
      });
    }

    if (now > new Date(voucher.validTo)) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        message: "This voucher has expired",
      });
    }

    // Check global usage limit
    if (voucher.usageLimit !== undefined && voucher.usedCount >= voucher.usageLimit) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        message: "This voucher has reached its usage limit",
      });
    }

    // Check per-user limit
    const userRedemptions = redemptionDb.findByVoucherAndUser(
      voucher.id,
      payload.userId
    );
    if (userRedemptions.length >= voucher.perUserLimit) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        message: "You have already used this voucher the maximum number of times",
      });
    }

    // Check minimum order amount
    if (orderAmount < voucher.minOrderAmount) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        message: `Minimum order amount is ₦${voucher.minOrderAmount.toLocaleString()}`,
      });
    }

    // Check applicable vendors
    if (
      voucher.applicableVendors.length > 0 &&
      vendorId &&
      !voucher.applicableVendors.includes(vendorId)
    ) {
      return NextResponse.json({
        valid: false,
        discount: 0,
        message: "This voucher is not valid for the selected vendor",
      });
    }

    // Check applicable categories
    if (
      voucher.applicableCategories.length > 0 &&
      categories &&
      Array.isArray(categories)
    ) {
      const hasApplicable = categories.some((c: string) =>
        voucher.applicableCategories.includes(c)
      );
      if (!hasApplicable) {
        return NextResponse.json({
          valid: false,
          discount: 0,
          message: "This voucher is not valid for the selected categories",
        });
      }
    }

    // Calculate discount
    const discount = calculateDiscount(voucher.type, voucher.value, orderAmount, voucher.maxDiscount);

    return NextResponse.json({
      valid: true,
      discount,
      voucherType: voucher.type,
      message:
        voucher.type === "FREE_DELIVERY"
          ? "Free delivery applied!"
          : `₦${discount.toLocaleString()} discount applied`,
    });
  } catch (error) {
    console.error("Validate voucher error:", error);
    return NextResponse.json(
      { valid: false, discount: 0, message: "Failed to validate voucher" },
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

  // Cap at order amount
  if (discount > orderAmount) {
    discount = orderAmount;
  }

  // Cap at max discount if set
  if (maxDiscount && discount > maxDiscount) {
    discount = maxDiscount;
  }

  return discount;
}
