import type { MetadataRoute } from "next";
import { db } from "@/lib/data/database";
import { VendorStatus } from "@/lib/constants";
import { APP_CONFIG } from "@/lib/constants";

const BASE_URL = APP_CONFIG.URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${BASE_URL}/products`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/vendors`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/login`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/register`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/signup`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/forgot-password`,
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.3,
        },
    ];

    // Dynamic product pages
    const productsResult = db.products.findAll({});
    const allProducts = Array.isArray(productsResult) ? productsResult : productsResult.data;
    const activeProducts = allProducts.filter((p: any) => p.isActive);
    const productPages: MetadataRoute.Sitemap = activeProducts.map((product: any) => ({
        url: `${BASE_URL}/products/${product.id}`,
        lastModified: new Date(product.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // Dynamic vendor pages (approved only)
    const vendors = db.vendors.findAll({ status: VendorStatus.APPROVED });
    const vendorPages: MetadataRoute.Sitemap = vendors.map((vendor: any) => ({
        url: `${BASE_URL}/vendors/${vendor.id}`,
        lastModified: new Date(vendor.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.6,
    }));

    return [...staticPages, ...productPages, ...vendorPages];
}
