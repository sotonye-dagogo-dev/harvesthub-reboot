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
import { Badge, Dropdown, Button, Empty, Spin } from "antd";
import { Bell, Check, Settings, X } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Notification, NotificationType } from "@/lib/types";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=10");
      const data = await res.json();

      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  // Fetch on mount and when dropdown opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get notification icon color based on type
  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case "ORDER_CONFIRMED":
      case "PAYMENT_SUCCESS":
        return "text-green-600 dark:text-green-400";
      case "ORDER_CANCELLED":
      case "PAYMENT_FAILED":
        return "text-red-600 dark:text-red-400";
      case "ORDER_READY":
      case "ORDER_DELIVERED":
        return "text-blue-600 dark:text-blue-400";
      case "LOW_STOCK":
        return "text-orange-600 dark:text-orange-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const dropdownContent = (
    <div className="w-96 max-h-[500px] overflow-hidden flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              type="text"
              size="small"
              onClick={markAllAsRead}
              className="text-xs text-purple-600 dark:text-purple-400"
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
          <div className="flex justify-center items-center p-8">
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            description="No notifications"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="py-8"
          />
        ) : (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer group ${
                  !notification.isRead ? "bg-purple-50 dark:bg-purple-900/20" : ""
                }`}
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
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="h-2 w-2 bg-purple-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {notification.message}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
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
                        deleteNotification(notification.id);
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
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <Link
            href="/notifications"
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
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
            <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Badge>
        }
        className="flex items-center"
      />
    </Dropdown>
  );
}
