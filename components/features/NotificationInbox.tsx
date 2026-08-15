"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Segmented, message } from "antd";
import { Bell, CheckCheck, RefreshCw, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EmptyState, SectionLoader, openActionConfirm, ActionConfirmPresets } from "@/components/ui";
import { useNotifications } from "@/lib/contexts/NotificationContext";

type InboxFilter = "all" | "unread";

export function NotificationInbox() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    lastSyncedAt,
  } = useNotifications();
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((notification) => !notification.isRead);
    }
    return notifications;
  }, [filter, notifications]);

  const handleMarkAsRead = async (id: string) => {
    setBusyId(id);
    try {
      await markAsRead(id);
    } finally {
      setBusyId((current) => (current === id ? null : current));
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      const ok = await deleteNotification(id);
      if (ok) {
        message.success("Notification deleted");
      } else {
        message.error("Failed to delete notification");
      }
    } finally {
      setBusyId((current) => (current === id ? null : current));
    }
  };

  const handleRetry = async () => {
    await fetchNotifications();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ds-text-primary">Notifications</h1>
          <p className="mt-1 text-ds-text-secondary">
            Inbox timeline for your account updates and delivery events.
          </p>
          <p className="mt-1 text-xs text-ds-text-tertiary">
            Last synced:{" "}
            {lastSyncedAt
              ? formatDistanceToNow(lastSyncedAt, { addSuffix: true })
              : "Not synced yet"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={filter}
            onChange={(value) => setFilter(value as InboxFilter)}
            options={[
              { label: `All (${notifications.length})`, value: "all" },
              { label: `Unread (${unreadCount})`, value: "unread" },
            ]}
          />
          <Button icon={<RefreshCw className="h-4 w-4" />} onClick={handleRetry} disabled={loading}>
            Refresh
          </Button>
          <Link href="/notifications/settings">
            <Button>Preferences</Button>
          </Link>
          {unreadCount > 0 && (
            <Button type="primary" icon={<CheckCheck className="h-4 w-4" />} onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <SectionLoader size="lg" className="py-12" />
      ) : error ? (
        <div className="rounded-ds-md border border-ds-status-error bg-ds-status-error-surface p-4">
          <p className="text-sm text-ds-status-error-text">{error}</p>
          <Button className="mt-3" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
          icon={<Bell className="h-10 w-10" />}
        />
      ) : (
        <div className="overflow-hidden rounded-ds-md border border-ds-border-base bg-ds-surface-base">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`border-b border-ds-border-base p-4 last:border-b-0 ${
                notification.isRead ? "bg-ds-surface-base" : "bg-ds-brand-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-ds-text-primary">{notification.title}</h3>
                    {!notification.isRead ? (
                      <span className="h-2 w-2 rounded-ds-full bg-ds-brand-primary" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-ds-text-secondary">{notification.message}</p>
                  <p className="mt-2 text-xs text-ds-text-tertiary">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      className="mt-2 inline-block text-xs font-medium text-ds-text-brand hover:underline"
                      onClick={() => {
                        if (!notification.isRead) {
                          void handleMarkAsRead(notification.id);
                        }
                      }}
                    >
                      Open related page
                    </Link>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {!notification.isRead && (
                    <Button
                      size="small"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={busyId === notification.id}
                    >
                      Mark read
                    </Button>
                  )}
                  <Button
                    size="small"
                    danger
                    icon={<Trash2 className="h-4 w-4" />}
                    disabled={busyId === notification.id}
                    onClick={() =>
                      openActionConfirm(ActionConfirmPresets.delete("notification"), () =>
                        handleDelete(notification.id)
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
