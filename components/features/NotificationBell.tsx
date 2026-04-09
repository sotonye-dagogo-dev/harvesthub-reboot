/**
 * Notification Bell Component
 *
 * Features:
 * - Unread count badge
 * - Dropdown with notifications
 * - Mark as read
 * - Navigate to notification settings
 */

"use client";

import { useState, useEffect } from "react";
import { Badge, Dropdown, Button } from "antd";
import { SectionLoader, EmptyState, openActionConfirm, ActionConfirmPresets } from "@/components/ui";
import { Bell, Check, Settings, X } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { NotificationType } from "@/lib/types";
import { useNotifications } from "@/lib/contexts/NotificationContext";

export function NotificationBell() {
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Fetch on mount and when dropdown opens
  useEffect(() => {
    if (open) {
      void fetchNotifications();
    }
  }, [fetchNotifications, open]);

  // Get notification icon color based on type
  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case "ORDER_CONFIRMED":
      case "PAYMENT_SUCCESS":
        return "text-ds-status-success-text";
      case "ORDER_CANCELLED":
      case "PAYMENT_FAILED":
        return "text-ds-status-error-text";
      case "ORDER_READY":
      case "ORDER_DELIVERED":
        return "text-ds-status-info-text";
      case "LOW_STOCK":
        return "text-ds-status-warning-text ";
      default:
        return "text-ds-text-secondary";
    }
  };

  const dropdownContent = (
    <div className="w-96 max-h-[500px] overflow-hidden flex flex-col bg-ds-surface-base rounded-ds-md shadow-ds-lg">
      {/* Header */}
      <div className="p-4 border-b border-ds-border-base flex justify-between items-center">
        <h3 className="font-semibold text-ds-text-primary">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              type="text"
              size="small"
              onClick={markAllAsRead}
              className="text-xs text-ds-text-brand"
            >
              Mark all read
            </Button>
          )}
          <Link href="/notifications/settings">
            <Button type="text" size="small" icon={<Settings className="h-4 w-4" />} />
          </Link>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <SectionLoader className="px-8" />
        ) : notifications.length === 0 ? (
          <EmptyState
            title="No notifications"
            icon={<Bell className="h-10 w-10" />}
            className="py-8"
          />
        ) : (
          <div>
            {" "}
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-ds-border-base hover:bg-ds-surface-sunken dark:hover:bg-ds-surface-overlay cursor-pointer group ${!notification.isRead ? "bg-ds-brand-surface dark:bg-ds-brand-subtle" : ""}`}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead(notification.id);
                  }
                  if (notification.link) {
                    window.location.href = notification.link;
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Bell className={`h-4 w-4 ${getNotificationColor(notification.type)}`} />
                      <h4 className="text-sm font-semibold text-ds-text-primary">
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="h-2 w-2 bg-ds-brand-primary rounded-ds-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-ds-text-secondary mb-2">{notification.message}</p>
                    <span className="text-xs text-ds-text-tertiary dark:text-ds-text-tertiary">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.isRead && (
                      <Button
                        type="text"
                        size="small"
                        icon={<Check className="h-4 w-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        title="Mark as read"
                      />
                    )}
                    <Button
                      type="text"
                      size="small"
                      icon={<X className="h-4 w-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        openActionConfirm(ActionConfirmPresets.delete("notification"), () =>
                          deleteNotification(notification.id)
                        );
                      }}
                      title="Delete"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-ds-border-base text-center">
          <Link href="/notifications" className="text-sm text-ds-text-brand hover:underline">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      overlay={dropdownContent}
      trigger={["click"]}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Button
        type="text"
        icon={
          <Badge count={unreadCount} size="small" offset={[-2, 2]}>
            <Bell className="h-5 w-5 text-ds-text-secondary" />
          </Badge>
        }
        className="flex items-center"
      />
    </Dropdown>
  );
}
