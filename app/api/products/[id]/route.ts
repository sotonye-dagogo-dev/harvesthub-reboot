import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";

// GET /api/products/[id] - Get product by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = db.products.findById(id);

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Increment views
        db.products.incrementViews(id);

        // Get vendor info
        const vendor = db.vendors.findById(product.vendorId);

        // Get reviews
        const reviews = db.reviews.findAll({ productId: id });

        return NextResponse.json({
            success: true,
            product: { ...product, vendor, reviews },
        });
    } catch (error) {
        console.error("Get product error:", error);
        return NextResponse.json(
            { error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}

// PUT /api/products/[id] - Update product (vendor owner only)
export async function PUT(
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

        const { id } = await params;
        const product = db.products.findById(id);

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Verify ownership
        const vendor = db.vendors.findByUserId(payload.userId);
        if (!vendor || vendor.id !== product.vendorId) {
            const user = db.users.findById(payload.userId);
            if (!user || user.role !== "ADMIN") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const body = await request.json();
        const updated = db.products.update(id, body);

        return NextResponse.json({ success: true, product: updated });
    } catch (error) {
        console.error("Update product error:", error);
        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}

// DELETE /api/products/[id] - Delete product
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

        const { id } = await params;
        const product = db.products.findById(id);

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Verify ownership or admin
        const vendor = db.vendors.findByUserId(payload.userId);
        if (!vendor || vendor.id !== product.vendorId) {
            const user = db.users.findById(payload.userId);
            if (!user || user.role !== "ADMIN") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        db.products.delete(id);

        return NextResponse.json({ success: true, message: "Product deleted" });
    } catch (error) {
        console.error("Delete product error:", error);
        return NextResponse.json(
            { error: "Failed to delete product" },
            { status: 500 }
        );
    }
}
