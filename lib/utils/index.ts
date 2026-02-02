/**
 * Utility functions for HarvestHub
 * Common helpers used across the application
 */

import { CURRENCY_FORMAT, PHONE_PREFIX } from '@/lib/constants';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================================
// CLASS NAME UTILITIES
// ============================================================================

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

/**
 * Format number as Nigerian Naira currency
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat(CURRENCY_FORMAT.LOCALE, {
        style: 'currency',
        currency: CURRENCY_FORMAT.CODE,
        currencyDisplay: 'symbol',
    }).format(amount);
}

/**
 * Format number with currency symbol only (no decimals for whole numbers)
 */
export function formatPrice(amount: number): string {
    const formatted = new Intl.NumberFormat(CURRENCY_FORMAT.LOCALE, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);

    return `${CURRENCY_FORMAT.SYMBOL}${formatted}`;
}

// ============================================================================
// PHONE NUMBER FORMATTING
// ============================================================================

/**
 * Format phone number with Nigerian country code
 */
export function formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // If it starts with 234, add +
    if (cleaned.startsWith('234')) {
        return `+${cleaned}`;
    }

    // If it starts with 0, replace with +234
    if (cleaned.startsWith('0')) {
        return `${PHONE_PREFIX}${cleaned.slice(1)}`;
    }

    // If it's just 10 digits, add +234
    if (cleaned.length === 10) {
        return `${PHONE_PREFIX}${cleaned}`;
    }

    return phone;
}

/**
 * Validate Nigerian phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');

    // Should be either 11 digits starting with 0, or 13 digits starting with 234
    return (
        (cleaned.length === 11 && cleaned.startsWith('0')) ||
        (cleaned.length === 13 && cleaned.startsWith('234'))
    );
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (format === 'short') {
        return new Intl.DateTimeFormat('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(d);
    }

    if (format === 'long') {
        return new Intl.DateTimeFormat('en-NG', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(d);
    }

    if (format === 'time') {
        return new Intl.DateTimeFormat('en-NG', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        }).format(d);
    }

    return d.toLocaleDateString('en-NG');
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    }

    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }

    if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }

    return formatDate(d, 'short');
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Truncate string to specified length with ellipsis
 */
export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return `${str.slice(0, length)}...`;
}

/**
 * Capitalize first letter of each word
 */
export function capitalize(str: string): string {
    return str
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Convert string to URL-friendly slug
 */
export function slugify(str: string): string {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ============================================================================
// NUMBER UTILITIES
// ============================================================================

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompactNumber(num: number): string {
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
    return `${(num / 1000000000).toFixed(1)}B`;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, whole: number): number {
    if (whole === 0) return 0;
    return Math.round((part / whole) * 100);
}

/**
 * Clamp number between min and max
 */
export function clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Group array items by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce(
        (result, item) => {
            const group = String(item[key]);
            if (!result[group]) {
                result[group] = [];
            }
            result[group].push(item);
            return result;
        },
        {} as Record<string, T[]>
    );
}

/**
 * Remove duplicates from array
 */
export function unique<T>(array: T[]): T[] {
    return Array.from(new Set(array));
}

/**
 * Shuffle array randomly
 */
export function shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j]!, newArray[i]!];
    }
    return newArray;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

// ============================================================================
// FILE UTILITIES
// ============================================================================

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// ============================================================================
// DELAY UTILITY
// ============================================================================

/**
 * Create a delay promise (useful for testing loading states)
 */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// RATING UTILITIES
// ============================================================================

/**
 * Generate array for star rating display
 */
export function generateStarArray(rating: number): boolean[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return [
        ...Array(fullStars).fill(true),
        ...(hasHalfStar ? [0.5] : []),
        ...Array(emptyStars).fill(false),
    ];
}

// ============================================================================
// ORDER NUMBER GENERATION
// ============================================================================

/**
 * Generate random ID of specified length
 */
export function generateId(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generate order number (format: HH-YYYYMMDD-XXXX)
 */
export function generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');

    return `HH-${year}${month}${day}-${random}`;
}

// ============================================================================
// COPY TO CLIPBOARD
// ============================================================================

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}
