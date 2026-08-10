import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/utils/auth";
import { UserRole } from "@/lib/constants";

type DashboardIconName =
    | "users"
    | "megaphone"
    | "shopping-bag"
    | "activity"
    | "package"
    | "bar-chart";

type MetricCard = {
    title: string;
    value: string;
    description: string;
    icon: DashboardIconName;
    href: string;
    cta: string;
};

type QuickAction = {
    title: string;
    description: string;
    href: string;
};

async function getAdminMetrics() {
    const [activeVendors, pendingAds, totalOrders, totalUsers, bannerAgg] = await Promise.all([
        prisma.vendor.count({ where: { status: "APPROVED" } }),
        prisma.adApplication.count({
            where: {
                status: { in: ["PENDING", "PENDING_PAYMENT", "PENDING_APPROVAL"] },
            },
        }),
        prisma.order.count(),
        prisma.user.count(),
        prisma.banner.aggregate({
            _sum: { impressionCount: true, clickCount: true, conversionCount: true },
        }),
    ]);

    const bannerImpressions = bannerAgg._sum.impressionCount ?? 0;
    const bannerClicks = bannerAgg._sum.clickCount ?? 0;
    const bannerConversions = bannerAgg._sum.conversionCount ?? 0;

    const cards: MetricCard[] = [
        {
            title: "Active Vendors",
            value: activeVendors.toLocaleString(),
            description: "Approved vendors currently selling.",
            icon: "users",
            href: "/operations/vendors",
            cta: "Manage vendors",
        },
        {
            title: "Pending Ads",
            value: pendingAds.toLocaleString(),
            description: "Applications waiting for review or payment confirmation.",
            icon: "megaphone",
            href: "/operations/ads",
            cta: "Review ads",
        },
        {
            title: "Banner Impressions",
            value: bannerImpressions.toLocaleString(),
            description: "Total banner views across all placements.",
            icon: "bar-chart",
            href: "/analytics",
            cta: "View ad analytics",
        },
        {
            title: "Banner Clicks",
            value: bannerClicks.toLocaleString(),
            description: `${bannerConversions.toLocaleString()} conversions from click-throughs.`,
            icon: "megaphone",
            href: "/analytics",
            cta: "View ad analytics",
        },
        {
            title: "Total Orders",
            value: totalOrders.toLocaleString(),
            description: "All-time order volume across the marketplace.",
            icon: "shopping-bag",
            href: "/operations/orders",
            cta: "View orders",
        },
        {
            title: "Registered Users",
            value: totalUsers.toLocaleString(),
            description: "Total user accounts on the platform.",
            icon: "activity",
            href: "/operations/users",
            cta: "Open user management",
        },
    ];

    const quickActions: QuickAction[] = [
        {
            title: "Ad & Banner Analytics",
            description: "Track impressions, clicks, conversions, and unique reach.",
            href: "/analytics",
        },
        {
            title: "Moderate Vendors",
            description: "Approve, reject, or suspend vendor accounts.",
            href: "/operations/vendors",
        },
        {
            title: "Manage Vouchers",
            description: "Create, edit, and manage discount vouchers and coupons.",
            href: "/operations/vouchers",
        },
        {
            title: "Publish Public Content",
            description: "Edit banners, policy pages, and help content.",
            href: "/operations/public-content",
        },
        {
            title: "Review Bug Reports",
            description: "Triage incoming reports and update resolution status.",
            href: "/operations/bug-reports",
        },
    ];

    return { cards, quickActions, emptyState: null as string | null };
}

async function getVendorMetrics(userId: string) {
    const vendor = await prisma.vendor.findUnique({ where: { userId }, select: { id: true } });
    if (!vendor) {
        return {
            cards: [] as MetricCard[],
            quickActions: [] as QuickAction[],
            emptyState:
                "Your vendor profile is not fully initialized yet. Complete onboarding to unlock dashboard metrics.",
        };
    }

    const [totalProducts, activeProducts, totalOrders, revenueAgg, pendingOrders] = await Promise.all([
        prisma.product.count({ where: { vendorId: vendor.id } }),
        prisma.product.count({ where: { vendorId: vendor.id, isActive: true } }),
        prisma.order.count({ where: { vendorId: vendor.id } }),
        prisma.order.aggregate({
            where: { vendorId: vendor.id, paymentStatus: "PAID" },
            _sum: { total: true },
        }),
        prisma.order.count({
            where: {
                vendorId: vendor.id,
                status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] },
            },
        }),
    ]);

    const cards: MetricCard[] = [
        {
            title: "Catalog Size",
            value: totalProducts.toLocaleString(),
            description: `${activeProducts.toLocaleString()} currently active listings.`,
            icon: "package",
            href: "/operations/products",
            cta: "Manage products",
        },
        {
            title: "Total Orders",
            value: totalOrders.toLocaleString(),
            description: `${pendingOrders.toLocaleString()} orders need attention.`,
            icon: "shopping-bag",
            href: "/operations/orders",
            cta: "Track orders",
        },
        {
            title: "Paid Revenue",
            value: `N${(revenueAgg._sum.total ?? 0).toLocaleString(undefined, {
                maximumFractionDigits: 2,
            })}`,
            description: "Settled order value from paid purchases.",
            icon: "bar-chart",
            href: "/analytics",
            cta: "Open analytics",
        },
    ];

    const quickActions: QuickAction[] = [
        {
            title: "Add New Product",
            description: "Create a new listing with images, pricing, and stock.",
            href: "/operations/products",
        },
        {
            title: "Update Store Settings",
            description: "Edit business profile, delivery, and pickup preferences.",
            href: "/store-settings",
        },
        {
            title: "Review Campaign Performance",
            description: "Track your ad applications and reach.",
            href: "/operations/ads",
        },
    ];

    return { cards, quickActions, emptyState: null as string | null };
}

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (user.role !== UserRole.ADMIN && user.role !== UserRole.VENDOR) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const metrics =
            user.role === UserRole.ADMIN
                ? await getAdminMetrics()
                : await getVendorMetrics(user.userId);

        return NextResponse.json({
            success: true,
            data: {
                role: user.role,
                cards: metrics.cards,
                quickActions: metrics.quickActions,
                emptyState: metrics.emptyState,
                updatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("GET /api/operations/dashboard error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
