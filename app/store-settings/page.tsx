"use client";

import { PageLoader } from "@/components/ui";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";


/**
 * Deprecated route — redirects vendors to the proper store-settings page.
 * @deprecated Use /vendor/store-settings instead.
 */

export default function StoreSettingsRedirectPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (user.role === "VENDOR") {
            router.replace("/vendor/store-settings");
        } else {
            router.replace("/");
        }
    }, [user, isLoading, router]);

    return (
        <PageLoader />
    );
}
