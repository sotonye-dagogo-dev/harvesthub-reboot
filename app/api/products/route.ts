import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";

// GET /api/products - List all products with optional filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category") || undefined;
        const vendorId = searchParams.get("vendorId") || undefined;
        const isActive = searchParams.get("isActive");
        const isFeatured = searchParams.get("isFeatured");
        const search = searchParams.get("search") || undefined;
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const page = searchParams.get("page")
            ? parseInt(searchParams.get("page")!)
            : undefined;
        const limit = searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined;

        const products = db.products.findAll({
            category,
            vendorId,
            isActive: isActive !== null ? isActive === "true" : undefined,
            isFeatured: isFeatured !== null ? isFeatured === "true" : undefined,
            search,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            page,
            limit,
        });

        return NextResponse.json({ success: true, products });
    } catch (error) {
        console.error("Get products error:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

// POST /api/products - Create a new product (vendor only)
export async function POST(request: NextRequest) {
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
        if (!user || user.role !== "VENDOR") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const vendor = db.vendors.findByUserId(user.id);
        if (!vendor) {
            return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
        }

        const body = await request.json();
        const product = db.products.create({
            ...body,
            vendorId: vendor.id,
            isActive: body.isActive ?? true,
            isFeatured: false,
        });

        return NextResponse.json({ success: true, product }, { status: 201 });
    } catch (error) {
        console.error("Create product error:", error);
        return NextResponse.json(
            { error: "Failed to create product" },
            { status: 500 }
        );
    }
}
