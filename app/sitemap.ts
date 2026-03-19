import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
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

    // Dynamic product pages (guarded against DB/network failures)
    let productPages: MetadataRoute.Sitemap = [];
    try {
        const activeProducts = await prisma.product.findMany({
            where: { isActive: true },
            select: { id: true, updatedAt: true },
        });

        productPages = activeProducts.map((product: { id: string; updatedAt: Date | null }) => ({
            url: `${BASE_URL}/products/${product.id}`,
            lastModified: product.updatedAt ?? new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }));
    } catch (err) {
        // If DB is unreachable during build, log and continue with static pages only
        // This keeps the build from failing due to transient network/DB issues.
        // Errors will appear in server logs but won't block the sitemap generation.
        // eslint-disable-next-line no-console
        console.error('Sitemap: failed to load products for sitemap:', err);
        productPages = [];
    }

    // Dynamic vendor pages (approved only) — guarded
    let vendorPages: MetadataRoute.Sitemap = [];
    try {
        const approvedVendors = await prisma.vendor.findMany({
            where: { status: VendorStatus.APPROVED },
            select: { id: true, updatedAt: true },
        });
        vendorPages = approvedVendors.map((vendor: { id: string; updatedAt: Date | null }) => ({
            url: `${BASE_URL}/vendors/${vendor.id}`,
            lastModified: vendor.updatedAt ?? new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.6,
        }));
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Sitemap: failed to load vendors for sitemap:', err);
        vendorPages = [];
    }

    return [...staticPages, ...productPages, ...vendorPages];
}
