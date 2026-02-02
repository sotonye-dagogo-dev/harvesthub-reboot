/**
 * Utility functions for HarvestHub
 * Commonly used formatting and helper functions
 */

/**
 * Format Nigerian Naira currency
 * @param amount - Amount to format
 * @returns Formatted currency string (e.g., "₦1,234.56")
 */
export function formatCurrency(amount: number): string {
    if (amount < 0) {
        return `-₦${Math.abs(amount).toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    return `₦${amount.toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

/**
 * Format date to readable string
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string (e.g., "Jan 30, 2025")
 */
export function formatDate(
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
    }

    return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...options,
    });
}

/**
 * Format Nigerian phone number with +234 prefix
 * @param phone - Phone number (e.g., "08012345678" or "+2348012345678")
 * @returns Formatted phone (e.g., "+234 801 234 5678")
 */
export function formatPhone(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 234, it already has country code
    if (cleaned.startsWith('234')) {
        cleaned = cleaned.slice(3);
    }

    // If starts with 0, remove it (local format)
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.slice(1);
    }

    // Ensure it's 10 digits
    if (cleaned.length !== 10) {
        return phone; // Return original if invalid
    }

    // Format as +234 XXX XXX XXXX
    return `+234 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
}

/**
 * Generate unique ID with prefix
 * @param prefix - Prefix for the ID (e.g., "user", "prod", "order")
 * @returns Unique ID (e.g., "user-1234567890-123")
 */
export function generateId(prefix: string = 'id'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}-${timestamp}-${random}`;
}

/**
 * Calculate order total from cart items
 * @param items - Array of cart items with price and quantity
 * @returns Total amount
 */
export function calculateOrderTotal(
    items: Array<{ price: number; quantity: number }>
): number {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
}

/**
 * Get initials from name
 * @param name - Full name
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Debounce function calls
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number = 300
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function (this: any, ...args: Parameters<T>) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Calculate percentage
 * @param value - Current value
 * @param total - Total value
 * @returns Percentage (0-100)
 */
export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

/**
 * Get time ago string
 * @param date - Date to compare
 * @returns Time ago string (e.g., "2 hours ago")
 */
export function getTimeAgo(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
    return `${Math.floor(seconds / 31536000)} years ago`;
}

/**
 * Validate Nigerian phone number
 * @param phone - Phone number to validate
 * @returns True if valid Nigerian phone number
 */
export function isValidNigerianPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');

    // Should be 11 digits starting with 0, or 13 digits starting with 234
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        return /^0[789][01]\d{8}$/.test(cleaned);
    }

    if (cleaned.length === 13 && cleaned.startsWith('234')) {
        return /^234[789][01]\d{8}$/.test(cleaned);
    }

    return false;
}

/**
 * Validate email address
 * @param email - Email to validate
 * @returns True if valid email
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Sleep/delay function
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
