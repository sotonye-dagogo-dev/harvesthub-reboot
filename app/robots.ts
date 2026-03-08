import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/api/",
                    "/admin/",
                    "/dashboard/",
                    "/cart/",
                    "/checkout/",
                    "/wallet/",
                    "/profile/",
                    "/orders/",
                    "/notifications/",
                    "/favourites/",
                    "/store-settings/",
                    "/signup-success/",
                ],
            },
        ],
        sitemap: `${APP_CONFIG.URL}/sitemap.xml`,
    };
}
