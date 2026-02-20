import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { UserRole } from "@/lib/constants";

// In-memory store for vendor responses (mock only - replace with DB in production)
const vendorResponses: Record<
    string,
    { text: string; vendorName: string; vendorId: string; createdAt: Date; updatedAt: Date }
> = {};

// GET /api/reviews/[id]/response - Get vendor response for a review
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const review = db.reviews.findById(id);
        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        const response = vendorResponses[id] ?? null;

        return NextResponse.json({
            success: true,
            response,
        });
    } catch (error) {
        console.error("Get vendor response error:", error);
        return NextResponse.json({ error: "Failed to fetch response" }, { status: 500 });
    }
}

// POST /api/reviews/[id]/response - Add or update vendor response
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { cookies } = await import("next/headers");
        const { verifyToken } = await import("@/lib/utils/auth");

        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const user = db.users.findById(payload.userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.role !== UserRole.VENDOR) {
            return NextResponse.json(
                { error: "Only vendors can respond to reviews" },
                { status: 403 }
            );
        }

        const vendor = db.vendors.findByUserId(user.id);
        if (!vendor) {
            return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
        }

        const { id } = await params;
        const review = db.reviews.findById(id);
        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        // Verify the review is for one of this vendor's products
        const product = db.products.findById(review.productId);
        if (!product || product.vendorId !== vendor.id) {
            return NextResponse.json(
                { error: "You can only respond to reviews on your own products" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { response: responseText } = body;

        if (!responseText || typeof responseText !== "string" || !responseText.trim()) {
            return NextResponse.json(
                { error: "Response text is required" },
                { status: 400 }
            );
        }

        const isUpdate = Boolean(vendorResponses[id]);
        const now = new Date();

        vendorResponses[id] = {
            text: responseText.trim(),
            vendorName: vendor.storeName,
            vendorId: vendor.id,
            createdAt: isUpdate ? vendorResponses[id]!.createdAt : now,
            updatedAt: now,
        };

        return NextResponse.json({
            success: true,
            message: isUpdate
                ? "Response updated successfully"
                : "Response added successfully",
            response: vendorResponses[id],
        });
    } catch (error) {
        console.error("Vendor response error:", error);
        return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
    }
}

// DELETE /api/reviews/[id]/response - Delete vendor response
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { cookies } = await import("next/headers");
        const { verifyToken } = await import("@/lib/utils/auth");

        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const user = db.users.findById(payload.userId);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { id } = await params;

        const existingResponse = vendorResponses[id];
        if (!existingResponse) {
            return NextResponse.json({ error: "Response not found" }, { status: 404 });
        }

        // Only the vendor who created the response or admin can delete it
        if (user.role === UserRole.VENDOR) {
            const vendor = db.vendors.findByUserId(user.id);
            if (!vendor || existingResponse.vendorId !== vendor.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } else if (user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        delete vendorResponses[id];

        return NextResponse.json({
            success: true,
            message: "Response deleted successfully",
        });
    } catch (error) {
        console.error("Delete vendor response error:", error);
        return NextResponse.json({ error: "Failed to delete response" }, { status: 500 });
    }
}
