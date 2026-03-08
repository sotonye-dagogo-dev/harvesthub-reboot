import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { VendorStatus } from "@/lib/constants";

// GET /api/vendors/[id]/products - Get products for a specific vendor
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const vendor = db.vendors.findById(id);

        if (!vendor) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        if (vendor.status !== VendorStatus.APPROVED) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category") || undefined;
        const search = searchParams.get("search") || undefined;
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

        const products = db.products.findAll({
            vendorId: id,
            isActive: true,
            category,
            search,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        });

        // Ensure products is an array (not paginated result object)
        const productList = Array.isArray(products) ? products : products.data;

        // Pagination
        const total = productList.length;
        const totalPages = Math.ceil(total / limit);
        const data = productList.slice((page - 1) * limit, page * limit);

        return NextResponse.json({
            success: true,
            products: data,
            pagination: { total, page, limit, totalPages },
            vendor: {
                id: vendor.id,
                storeName: vendor.storeName,
                storeLogo: vendor.storeLogo,
                campus: vendor.campus,
            },
        });
    } catch (error) {
        console.error("Get vendor products error:", error);
        return NextResponse.json({ error: "Failed to fetch vendor products" }, { status: 500 });
    }
}
