"use client";

import { useState, useEffect, useCallback } from "react";

interface NetworkStatus {
    isOnline: boolean;
    wasOffline: boolean;
}

/**
 * Hook to monitor browser network connectivity.
 * Tracks online/offline state and whether the session has gone offline.
 */
export function useNetworkStatus(): NetworkStatus {
    const [isOnline, setIsOnline] = useState(true);
    const [wasOffline, setWasOffline] = useState(false);

    const handleOnline = useCallback(() => {
        setIsOnline(true);
    }, []);

    const handleOffline = useCallback(() => {
        setIsOnline(false);
        setWasOffline(true);
    }, []);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        if (!navigator.onLine) setWasOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [handleOnline, handleOffline]);

    return { isOnline, wasOffline };
}

/**
 * Guard a network-dependent operation. Returns false and shows message if offline.
 */
export function checkOnline(messageApi?: { warning: (config: { content: string; key?: string }) => void }): boolean {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
        messageApi?.warning({
            content: "You are offline. This action requires an internet connection.",
            key: "offline-guard",
        });
        return false;
    }
    return true;
}
