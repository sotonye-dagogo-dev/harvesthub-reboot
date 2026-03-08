"use client";

import { Tag } from "antd";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

// ============================================================================
// CENTRALISED STATUS → antd Tag COLOR MAPS
//
// Every entity type that shows a coloured status tag has ONE canonical map
// here. When a new status is added to an enum, add it in **one** place.
// ============================================================================

/**
 * Order status colours (maps OrderStatus enum values)
 * Covers: PENDING · CONFIRMED · PROCESSING · READY · COMPLETED · CANCELLED · REFUNDED
 */
const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  CONFIRMED: "blue",
  PROCESSING: "purple",
  READY: "cyan",
  SHIPPED: "geekblue",
  DELIVERED: "green",
  COMPLETED: "green",
  CANCELLED: "red",
  REFUNDED: "magenta",
};

/**
 * Payment status colours (maps PaymentStatus enum values)
 */
const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  PAID: "green",
  FAILED: "red",
  REFUNDED: "purple",
};

/**
 * Vendor status colours (maps VendorStatus enum values)
 */
const VENDOR_STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  APPROVED: "green",
  SUSPENDED: "red",
  REJECTED: "volcano",
};

/**
 * User role colours (maps UserRole enum values)
 */
const USER_ROLE_COLORS: Record<string, string> = {
  ADMIN: "purple",
  VENDOR: "blue",
  BUYER: "green",
};

/**
 * User account status colours
 */
const USER_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "green",
  INACTIVE: "default",
  BANNED: "red",
};

/**
 * Transaction status colours
 */
const TRANSACTION_STATUS_COLORS: Record<string, string> = {
  PENDING: "orange",
  COMPLETED: "green",
  FAILED: "red",
  REVERSED: "magenta",
};

/**
 * Notification type colours
 */
const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  ORDER_CONFIRMED: "blue",
  ORDER_READY: "green",
  ORDER_DELIVERED: "cyan",
  ORDER_CANCELLED: "red",
  PAYMENT_SUCCESS: "green",
  PAYMENT_FAILED: "red",
  DELIVERY_UPDATE: "orange",
  VENDOR_MESSAGE: "purple",
  LOW_STOCK: "orange",
  NEW_PRODUCT: "blue",
  PROMOTION: "magenta",
};

/**
 * Stock-level helper — returns an antd colour string based on quantity.
 */
export function stockLevelColor(stock: number): string {
  if (stock > 10) return "green";
  if (stock > 0) return "orange";
  return "red";
}

/**
 * Boolean status helper — maps true/false to a colour string.
 */
export function booleanColor(value: boolean, trueColor = "green", falseColor = "red"): string {
  return value ? trueColor : falseColor;
}

// ============================================================================
// LOOKUP UNION TYPE
// ============================================================================

/** All supported status domains. */
export type StatusDomain =
  | "order"
  | "payment"
  | "vendor"
  | "role"
  | "user"
  | "transaction"
  | "notification";

const DOMAIN_MAP: Record<StatusDomain, Record<string, string>> = {
  order: ORDER_STATUS_COLORS,
  payment: PAYMENT_STATUS_COLORS,
  vendor: VENDOR_STATUS_COLORS,
  role: USER_ROLE_COLORS,
  user: USER_STATUS_COLORS,
  transaction: TRANSACTION_STATUS_COLORS,
  notification: NOTIFICATION_TYPE_COLORS,
};

/**
 * Resolve a status string to an antd `Tag` colour string.
 *
 * @param domain - The entity domain (order, payment, vendor, role, user, transaction, notification)
 * @param status - The status/enum value (e.g. "PENDING", "APPROVED")
 * @returns antd colour preset string (e.g. "green", "orange")
 */
export function getTagColor(domain: StatusDomain, status: string): string {
  const map = DOMAIN_MAP[domain];
  return map[status.toUpperCase()] ?? "default";
}

// ============================================================================
// STATUS TAG COMPONENT
// ============================================================================

export interface StatusTagProps {
  /** The entity domain — determines which colour map to use. */
  domain: StatusDomain;
  /** The raw status or enum value (e.g. "PENDING", OrderStatus.COMPLETED). */
  status: string;
  /**
   * Override the displayed label. By default the status value is shown
   * with initial-cap formatting (e.g. "PENDING" → "Pending").
   */
  label?: ReactNode;
  /** Optional icon rendered before the label inside the tag. */
  icon?: ReactNode;
  /** Override the antd colour preset. When provided, the domain map is ignored. */
  color?: string;
  /** Extra Tailwind / CSS classes. */
  className?: string;
}

/**
 * Capitalise the first letter and lowercase the rest.
 * e.g. "PENDING" → "Pending", "ready" → "Ready"
 */
function formatLabel(raw: string): string {
  if (!raw) return "";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

/**
 * `StatusTag` renders an antd `<Tag>` with a colour determined by a
 * centralised status-colour map. It removes the need for every page to
 * define its own `statusColor(…)` function.
 *
 * @example
 *   <StatusTag domain="order"   status={order.status} />
 *   <StatusTag domain="payment" status={order.paymentStatus} />
 *   <StatusTag domain="vendor"  status={vendor.status} />
 *   <StatusTag domain="role"    status={user.role} />
 */
export function StatusTag({ domain, status, label, icon, color, className }: StatusTagProps) {
  const resolvedColor = color ?? getTagColor(domain, status);
  const displayLabel = label ?? formatLabel(status);

  return (
    <Tag color={resolvedColor} className={cn("m-0", className)}>
      {icon && <span className="mr-1 inline-flex items-center align-middle">{icon}</span>}
      {displayLabel}
    </Tag>
  );
}

// Re-export individual maps for edge cases where a component needs the raw map
export {
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  VENDOR_STATUS_COLORS,
  USER_ROLE_COLORS,
  USER_STATUS_COLORS,
  TRANSACTION_STATUS_COLORS,
  NOTIFICATION_TYPE_COLORS,
};
