import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/database";
import { VendorStatus } from "@/lib/constants";

// GET /api/vendors - Get vendor list (public)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") as VendorStatus | null;
        const campus = searchParams.get("campus") || undefined;
        const category = searchParams.get("category") || undefined;
        const search = searchParams.get("search") || undefined;
        const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

        const filters = {
            status: status || VendorStatus.APPROVED, // Public only sees approved vendors
            campus,
            category,
        };

        let vendors = db.vendors.findAll(filters);

        // Search by store name or description
        if (search) {
            const q = search.toLowerCase();
            vendors = vendors.filter(
                (v) =>
                    v.storeName.toLowerCase().includes(q) ||
                    v.storeDescription?.toLowerCase().includes(q)
            );
        }

        // Enrich with product counts
        const enriched = vendors.map((vendor) => {
            const products = db.products.findByVendor(vendor.id).filter((p) => p.isActive);
            return { ...vendor, productCount: products.length };
        });

        // Pagination
        const total = enriched.length;
        const totalPages = Math.ceil(total / limit);
        const data = enriched.slice((page - 1) * limit, page * limit);

        return NextResponse.json({
            success: true,
            vendors: data,
            pagination: { total, page, limit, totalPages },
        });
    } catch (error) {
        console.error("Get vendors error:", error);
        return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
    }
}
