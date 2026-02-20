"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Loader2 } from "lucide-react";

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
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
    );
}
