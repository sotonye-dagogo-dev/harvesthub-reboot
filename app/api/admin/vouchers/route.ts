import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import { voucherDb } from "@/lib/data/vouchers";
import type { VoucherRecord } from "@/lib/data/vouchers";

// GET /api/admin/vouchers - List all vouchers (admin only)
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
    const isActive = searchParams.get("isActive");
    const type = searchParams.get("type") as VoucherRecord["type"] | null;

    const vouchers = voucherDb.findAll({
      isActive: isActive !== null ? isActive === "true" : undefined,
      type: type || undefined,
    });

    return NextResponse.json({
      success: true,
      vouchers,
      total: vouchers.length,
    });
  } catch (error) {
    console.error("Admin list vouchers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vouchers" },
      { status: 500 }
    );
  }
}

// POST /api/admin/vouchers - Create new voucher(s) (admin only)
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

    if (payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      code,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      perUserLimit,
      validFrom,
      validTo,
      applicableCategories,
      applicableVendors,
      // Bulk generation fields
      count,
      prefix,
    } = body;

    // Validate required fields
    if (!type || !["PERCENTAGE", "FIXED_AMOUNT", "FREE_DELIVERY"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be PERCENTAGE, FIXED_AMOUNT, or FREE_DELIVERY" },
        { status: 400 }
      );
    }

    if (type !== "FREE_DELIVERY" && (!value || typeof value !== "number" || value <= 0)) {
      return NextResponse.json(
        { error: "Value must be a positive number" },
        { status: 400 }
      );
    }

    if (!validFrom || !validTo) {
      return NextResponse.json(
        { error: "validFrom and validTo are required" },
        { status: 400 }
      );
    }

    if (new Date(validTo) <= new Date(validFrom)) {
      return NextResponse.json(
        { error: "validTo must be after validFrom" },
        { status: 400 }
      );
    }

    if (type === "PERCENTAGE" && value > 100) {
      return NextResponse.json(
        { error: "Percentage value cannot exceed 100" },
        { status: 400 }
      );
    }

    const baseData = {
      type: type as VoucherRecord["type"],
      value: type === "FREE_DELIVERY" ? 0 : value,
      minOrderAmount: minOrderAmount || 0,
      maxDiscount: maxDiscount || undefined,
      usageLimit: usageLimit || undefined,
      perUserLimit: perUserLimit || 1,
      validFrom: new Date(validFrom).toISOString(),
      validTo: new Date(validTo).toISOString(),
      isActive: true,
      applicableCategories: applicableCategories || [],
      applicableVendors: applicableVendors || [],
      createdBy: payload.userId,
    };

    // Bulk generation
    if (count && typeof count === "number" && count > 1) {
      if (count > 500) {
        return NextResponse.json(
          { error: "Maximum bulk generation is 500 vouchers" },
          { status: 400 }
        );
      }

      const vouchers = voucherDb.bulkCreate(baseData, count, prefix || "HH");

      return NextResponse.json({
        success: true,
        message: `${count} vouchers created`,
        vouchers,
        total: vouchers.length,
      });
    }

    // Single voucher creation
    if (code) {
      const existing = voucherDb.findByCode(code);
      if (existing) {
        return NextResponse.json(
          { error: "Voucher code already exists" },
          { status: 409 }
        );
      }
    }

    const voucher = voucherDb.create({
      ...baseData,
      code: code?.toUpperCase() || generateCode(prefix),
    });

    return NextResponse.json({
      success: true,
      message: "Voucher created",
      voucher,
    });
  } catch (error) {
    console.error("Admin create voucher error:", error);
    return NextResponse.json(
      { error: "Failed to create voucher" },
      { status: 500 }
    );
  }
}

function generateCode(prefix?: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix ? `${prefix}-${code}` : code;
}
