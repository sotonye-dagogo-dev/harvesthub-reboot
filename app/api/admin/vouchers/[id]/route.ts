import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";
import { voucherDb, redemptionDb } from "@/lib/data/vouchers";

// GET /api/admin/vouchers/[id] - Single voucher detail with redemption history (admin)
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
    const voucher = voucherDb.findById(id);

    if (!voucher) {
      return NextResponse.json(
        { error: "Voucher not found" },
        { status: 404 }
      );
    }

    const redemptions = redemptionDb.findAll({ voucherId: id });

    return NextResponse.json({
      success: true,
      voucher,
      redemptions,
      totalRedemptions: redemptions.length,
    });
  } catch (error) {
    console.error("Admin get voucher detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch voucher" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/vouchers/[id] - Update/deactivate voucher (admin)
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
    const voucher = voucherDb.findById(id);

    if (!voucher) {
      return NextResponse.json(
        { error: "Voucher not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { isActive, value, usageLimit, perUserLimit, validTo } = body;

    const updateData: Record<string, unknown> = {};

    if (isActive !== undefined && typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    if (value !== undefined && typeof value === "number" && value > 0) {
      if (voucher.type === "PERCENTAGE" && value > 100) {
        return NextResponse.json(
          { error: "Percentage value cannot exceed 100" },
          { status: 400 }
        );
      }
      updateData.value = value;
    }

    if (usageLimit !== undefined && typeof usageLimit === "number" && usageLimit >= 0) {
      updateData.usageLimit = usageLimit;
    }

    if (perUserLimit !== undefined && typeof perUserLimit === "number" && perUserLimit >= 1) {
      updateData.perUserLimit = perUserLimit;
    }

    if (validTo) {
      if (new Date(validTo) <= new Date(voucher.validFrom)) {
        return NextResponse.json(
          { error: "validTo must be after validFrom" },
          { status: 400 }
        );
      }
      updateData.validTo = new Date(validTo).toISOString();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = voucherDb.update(id, updateData);

    return NextResponse.json({
      success: true,
      message: "Voucher updated",
      voucher: updated,
    });
  } catch (error) {
    console.error("Admin update voucher error:", error);
    return NextResponse.json(
      { error: "Failed to update voucher" },
      { status: 500 }
    );
  }
}
