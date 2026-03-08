import type { VendorCategory, OrderStatus, PaymentStatus, DeliveryMethod } from "@/lib/types";
import type { Campus, Position } from "@/lib/constants";
import { CAMPUS_LOCATIONS, POSITION_OPTIONS } from "@/lib/constants";

/**
 * Format campus enum to readable string
 */
export function formatCampus(campus: Campus): string {
    const entry = CAMPUS_LOCATIONS.find((c) => c.value === campus);
    return entry?.label ?? campus;
}

/**
 * Format position enum to readable string
 */
export function formatPosition(position: Position): string {
    const entry = POSITION_OPTIONS.find((p) => p.value === position);
    return entry?.label ?? position;
}

/**
 * Format vendor category enum to readable string
 */
export function formatVendorCategory(category: VendorCategory): string {
    const categoryMap: Record<VendorCategory, string> = {
        FARM_PRODUCE: "Farm Produce",
        FASHION: "Fashion & Apparel",
        FOOD_BEVERAGES: "Food & Beverages",
        BEAUTY: "Beauty & Cosmetics",
        ELECTRONICS: "Electronics & Gadgets",
        HOME_KITCHEN: "Home & Kitchen",
        BOOKS: "Books & Stationery",
        SERVICES: "Services",
        CRAFTS: "Crafts & Handmade",
        OTHERS: "Others",
    };
    return categoryMap[category] || category;
}

/**
 * Format order status enum to readable string
 */
export function formatOrderStatus(status: OrderStatus): string {
    const statusMap: Record<OrderStatus, string> = {
        PENDING: "Pending",
        CONFIRMED: "Confirmed",
        PROCESSING: "Processing",
        READY_FOR_PICKUP: "Ready for Pickup",
        OUT_FOR_DELIVERY: "Out for Delivery",
        DELIVERED: "Delivered",
        CANCELLED: "Cancelled",
        REFUNDED: "Refunded",
    };
    return statusMap[status] || status;
}

/**
 * Format payment status enum to readable string
 */
export function formatPaymentStatus(status: PaymentStatus): string {
    const statusMap: Record<PaymentStatus, string> = {
        PENDING: "Pending",
        PAID: "Paid",
        FAILED: "Failed",
        REFUNDED: "Refunded",
    };
    return statusMap[status] || status;
}

/**
 * Format delivery method enum to readable string
 */
export function formatDeliveryMethod(method: DeliveryMethod): string {
    return method === "PICKUP" ? "Church Pickup" : "Home Delivery";
}

/**
 * Format phone number to Nigerian format
 */
export function formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, "");

    // If starts with 234, format as +234 XXX XXX XXXX
    if (digits.startsWith("234")) {
        const number = digits.slice(3);
        return `+234 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }

    // If starts with 0, replace with +234
    if (digits.startsWith("0")) {
        const number = digits.slice(1);
        return `+234 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }

    // Otherwise assume it's 10 digits without country code
    return `+234 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    }
    if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? "s" : ""} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? "s" : ""} ago`;
}
