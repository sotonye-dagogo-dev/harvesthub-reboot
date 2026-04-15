"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import type { Notification } from "@/lib/types";
import { useToast } from "@/lib/contexts/ToastContext";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (silent?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  /**
   * Requests browser push permission when needed and synchronizes the current
   * browser push subscription with backend persistence.
   * Returns true when subscription sync succeeds.
   */
  enablePushNotifications: () => Promise<boolean>;
  /**
   * Removes backend/browser push subscription for this device.
   * Returns true when local unsubscribe and backend cleanup both complete.
   */
  disablePushNotifications: () => Promise<boolean>;
  /**
   * Returns current browser Notification.permission state.
   * Returns "unsupported" when Notification APIs are unavailable in this environment.
   */
  getBrowserPushPermission: () => NotificationPermission | "unsupported";
  checkPushHealth: () => Promise<{
    supported: boolean;
    permission: NotificationPermission | "unsupported";
    serviceWorkerReady: boolean;
    hasSubscription: boolean;
    endpoint: string | null;
    backendSynced: boolean;
    backendSubscriptionCount: number;
    message: string;
  }>;
  refreshNotifications: () => void;
  lastSyncedAt: Date | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
const NOTIFICATION_REFRESH_INTERVAL_MS = 60_000;
const PASSIVE_REFRESH_THROTTLE_MS = 15_000;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());
  const hasHydratedNotificationFeedRef = useRef(false);
  const lastPassiveRefreshAtRef = useRef(0);

  const fetchNotifications = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      try {
        const res = await fetch("/api/notifications?limit=50");

        if (!res.ok) {
          // Silently fail - API might not be ready yet.
          // Avoid logging 401 for anonymous users.
          if (res.status === 401) {
            setNotifications([]);
            setUnreadCount(0);
            setError(null);
            setLastSyncedAt(new Date());
            return;
          }
          console.warn("Notifications API not available");
          setError("Unable to load notifications right now.");
          return;
        }

        const data = await res.json();

        if (data.success) {
          const incomingNotifications = (data.notifications || []) as Notification[];

          if (hasHydratedNotificationFeedRef.current) {
            const freshUnreadNotifications = incomingNotifications.filter(
              (notification) =>
                !notification.isRead && !knownNotificationIdsRef.current.has(notification.id)
            );

            if (freshUnreadNotifications.length > 0) {
              const newest = freshUnreadNotifications[0];
              const countLabel =
                freshUnreadNotifications.length === 1
                  ? "You have a new notification"
                  : `You have ${freshUnreadNotifications.length} new notifications`;

              toast.info(countLabel, newest?.title ?? "Open Notifications to review updates.");
            }
          }

          knownNotificationIdsRef.current = new Set(
            incomingNotifications.map((notification) => notification.id)
          );
          hasHydratedNotificationFeedRef.current = true;

          setNotifications(incomingNotifications);
          setUnreadCount(data.unreadCount || 0);
          setError(null);
          setLastSyncedAt(new Date());
        }
      } catch (error) {
        // Silently fail - don't break the app if notifications aren't available
        console.warn("Notifications temporarily unavailable:", error);
        setError("Unable to load notifications right now.");
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [toast]
  );

  const markAsRead = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        let removedUnread = false;
        setNotifications((prev) => {
          const target = prev.find((n) => n.id === id);
          removedUnread = target?.isRead === false;
          return prev.filter((n) => n.id !== id);
        });

        if (removedUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }, []);

  const syncPushSubscription = useCallback(async (requestPermission: boolean): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) return false;

    let permission = Notification.permission;
    if (requestPermission && permission !== "granted") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") return false;

    try {
      const registration = await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        });
      }

      const payload = subscription.toJSON();
      const endpoint = payload.endpoint;
      const p256dh = payload.keys?.p256dh;
      const auth = payload.keys?.auth;

      if (!endpoint || !p256dh || !auth) {
        return false;
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint,
          keys: { p256dh, auth },
        }),
      });

      return res.ok;
    } catch (error) {
      console.warn("Push subscription sync failed:", error);
      return false;
    }
  }, []);

  const enablePushNotifications = useCallback(async () => {
    return syncPushSubscription(true);
  }, [syncPushSubscription]);

  const disablePushNotifications = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        return true;
      }

      const endpoint = subscription.endpoint;
      const unsubscribeResult = await subscription.unsubscribe();

      const res = await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });

      // Treat 404 as success to support drift-safe cleanup when backend record is already absent.
      return unsubscribeResult && (res.ok || res.status === 404);
    } catch (pushError) {
      console.warn("Push unsubscribe cleanup failed:", pushError);
      return false;
    }
  }, []);

  const getBrowserPushPermission = useCallback((): NotificationPermission | "unsupported" => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      return "unsupported";
    }
    return Notification.permission;
  }, []);

  const refreshNotifications = useCallback(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const requestPassiveRefresh = useCallback(
    (force = false) => {
      const now = Date.now();
      if (!force && now - lastPassiveRefreshAtRef.current < PASSIVE_REFRESH_THROTTLE_MS) {
        return;
      }
      lastPassiveRefreshAtRef.current = now;
      void fetchNotifications(true);
    },
    [fetchNotifications]
  );

  const checkPushHealth = useCallback(async () => {
    if (typeof window === "undefined") {
      return {
        supported: false,
        permission: "unsupported" as const,
        serviceWorkerReady: false,
        hasSubscription: false,
        endpoint: null,
        backendSynced: false,
        backendSubscriptionCount: 0,
        message: "Push health checks are unavailable during server rendering.",
      };
    }

    const supported = "serviceWorker" in navigator && "PushManager" in window;
    if (!supported) {
      return {
        supported: false,
        permission:
          typeof Notification === "undefined" ? ("unsupported" as const) : Notification.permission,
        serviceWorkerReady: false,
        hasSubscription: false,
        endpoint: null,
        backendSynced: false,
        backendSubscriptionCount: 0,
        message: "Push notifications are not supported on this browser/device.",
      };
    }

    const permission =
      typeof Notification === "undefined" ? ("unsupported" as const) : Notification.permission;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const endpoint = subscription?.endpoint ?? null;

      if (!endpoint) {
        return {
          supported: true,
          permission,
          serviceWorkerReady: true,
          hasSubscription: false,
          endpoint: null,
          backendSynced: false,
          backendSubscriptionCount: 0,
          message:
            permission === "granted"
              ? "Permission granted, but this browser has no active push subscription."
              : "Push permission has not been granted yet.",
        };
      }

      const res = await fetch("/api/push/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
      const payload = await res.json().catch(() => ({}));

      return {
        supported: true,
        permission,
        serviceWorkerReady: true,
        hasSubscription: true,
        endpoint,
        backendSynced: Boolean(res.ok && payload?.exists),
        backendSubscriptionCount:
          typeof payload?.totalSubscriptions === "number" ? payload.totalSubscriptions : 0,
        message:
          res.ok && payload?.exists
            ? "Push subscription is healthy and synchronized with backend records."
            : "Browser subscription exists but backend record is missing.",
      };
    } catch (pushHealthError) {
      return {
        supported: true,
        permission,
        serviceWorkerReady: false,
        hasSubscription: false,
        endpoint: null,
        backendSynced: false,
        backendSubscriptionCount: 0,
        message:
          pushHealthError instanceof Error
            ? pushHealthError.message
            : "Unable to complete push health check.",
      };
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => {
      void fetchNotifications(true);
    }, NOTIFICATION_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onFocus = () => {
      requestPassiveRefresh();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestPassiveRefresh();
      }
    };

    const onOnline = () => {
      requestPassiveRefresh(true);
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [requestPassiveRefresh]);

  useEffect(() => {
    syncPushSubscription(false).catch(() => {
      // No-op: silent background sync for already-granted permissions.
    });
  }, [syncPushSubscription]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        enablePushNotifications,
        disablePushNotifications,
        getBrowserPushPermission,
        checkPushHealth,
        refreshNotifications,
        lastSyncedAt,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
