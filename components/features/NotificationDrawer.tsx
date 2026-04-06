/**
 * Notification Drawer Component
 *
 * Features:
 * - Full notifications list with infinite scroll
 * - Filter by type and read status
 * - Mark as read/unread
 * - Delete notifications
 * - Navigate to related content
 */

"use client";

import { useState, useMemo } from "react";
import { StatusTag, SectionLoader, EmptyState, openActionConfirm, ActionConfirmPresets } from "@/components/ui";
import { Drawer, Tabs, Button, Dropdown, Space } from "antd";
import { Check, CheckCheck, Filter, MoreVertical, Trash2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useNotifications } from "@/lib/contexts/NotificationContext";
import type { Notification, NotificationType } from "@/lib/types";

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

const notificationTypeLabels: Record<NotificationType, string> = {
  ORDER_CONFIRMED: "Order Confirmed",
  ORDER_READY: "Order Ready",
  ORDER_DELIVERED: "Order Delivered",
  ORDER_CANCELLED: "Order Cancelled",
  PAYMENT_SUCCESS: "Payment Success",
  PAYMENT_FAILED: "Payment Failed",
  DELIVERY_UPDATE: "Delivery Update",
  VENDOR_MESSAGE: "Vendor Message",
  LOW_STOCK: "Low Stock",
  NEW_PRODUCT: "New Product",
  PROMOTION: "Promotion",
};

export function NotificationDrawer({ open, onClose }: NotificationDrawerProps) {
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification, unreadCount } =
    useNotifications();

  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [filterType, setFilterType] = useState<NotificationType | "all">("all");

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by read status
    if (activeTab === "unread") {
      filtered = filtered.filter((n) => !n.isRead);
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((n) => n.type === filterType);
    }

    return filtered;
  }, [notifications, activeTab, filterType]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (notification.link) {
      onClose();
      // Navigation will happen via Link component
    }
  };

  const renderNotification = (notification: Notification) => {
    return (
      <div
        key={notification.id}
        className={`border-b last:border-b-0 transition-colors ${
          !notification.isRead ? "bg-ds-brand-surface " : ""
        }`}
      >
        {notification.link ? (
          <Link href={notification.link} className="block">
            <div
              onClick={() => handleNotificationClick(notification)}
              className="p-4 cursor-pointer hover:bg-ds-surface-sunken"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusTag
                      domain="notification"
                      status={notification.type}
                      label={notificationTypeLabels[notification.type]}
                    />
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-ds-brand-primary-light rounded-ds-full" />
                    )}
                  </div>

                  <h4 className="font-semibold text-ds-text-primary mb-1">{notification.title}</h4>

                  <p className="text-sm text-ds-text-secondary mb-2">{notification.message}</p>

                  <p className="text-xs text-ds-text-tertiary">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>

                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "mark",
                        icon: notification.isRead ? <Eye size={16} /> : <Check size={16} />,
                        label: notification.isRead ? "Mark as unread" : "Mark as read",
                        onClick: () => markAsRead(notification.id),
                      },
                      {
                        key: "delete",
                        icon: <Trash2 size={16} />,
                        label: "Delete",
                        danger: true,
                        onClick: () =>
                          openActionConfirm(ActionConfirmPresets.delete("notification"), () =>
                            deleteNotification(notification.id)
                          ),
                      },
                    ],
                  }}
                  trigger={["click"]}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<MoreVertical size={16} />}
                    onClick={(e) => e.preventDefault()}
                  />
                </Dropdown>
              </div>
            </div>
          </Link>
        ) : (
          <div className="block">
            <div
              onClick={() => handleNotificationClick(notification)}
              className="p-4 cursor-pointer hover:bg-ds-surface-sunken"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusTag
                      domain="notification"
                      status={notification.type}
                      label={notificationTypeLabels[notification.type]}
                    />
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-ds-brand-primary-light rounded-ds-full" />
                    )}
                  </div>

                  <h4 className="font-semibold text-ds-text-primary mb-1">{notification.title}</h4>

                  <p className="text-sm text-ds-text-secondary mb-2">{notification.message}</p>

                  <p className="text-xs text-ds-text-tertiary">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>

                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "mark",
                        icon: notification.isRead ? <Eye size={16} /> : <Check size={16} />,
                        label: notification.isRead ? "Mark as unread" : "Mark as read",
                        onClick: () => markAsRead(notification.id),
                      },
                      {
                        key: "delete",
                        icon: <Trash2 size={16} />,
                        label: "Delete",
                        danger: true,
                        onClick: () =>
                          openActionConfirm(ActionConfirmPresets.delete("notification"), () =>
                            deleteNotification(notification.id)
                          ),
                      },
                    ],
                  }}
                  trigger={["click"]}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<MoreVertical size={16} />}
                    onClick={(e) => e.preventDefault()}
                  />
                </Dropdown>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <span>Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
          <Space>
            <Dropdown
              menu={{
                items: Object.entries(notificationTypeLabels).map(([type, label]) => ({
                  key: type,
                  label,
                  onClick: () => setFilterType(type as NotificationType),
                })),
              }}
              trigger={["click"]}
            >
              <Button icon={<Filter size={16} />} size="small">
                {filterType === "all" ? "Filter" : notificationTypeLabels[filterType]}
              </Button>
            </Dropdown>

            {unreadCount > 0 && (
              <Button icon={<CheckCheck size={16} />} size="small" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </Space>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
      className="notification-drawer"
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as "all" | "unread")}
        items={[
          {
            key: "all",
            label: `All (${notifications.length})`,
          },
          {
            key: "unread",
            label: `Unread (${unreadCount})`,
          },
        ]}
      />

      <div className="mt-4">
        {loading && <SectionLoader />}

        {!loading && filteredNotifications.length === 0 && (
          <EmptyState
            title={activeTab === "unread" ? "No unread notifications" : "No notifications yet"}
            icon={<Check className="h-10 w-10" />}
          />
        )}

        {!loading && filteredNotifications.length > 0 && (
          <div className="space-y-0 -mx-6">{filteredNotifications.map(renderNotification)}</div>
        )}
      </div>
    </Drawer>
  );
}
