/**
 * MyHarvestHub Design System — Central Index
 *
 * This module is the **single import** for anything design-system related.
 * It re-exports the palette, semantic token helpers, Ant Design theme configs,
 * z-index scale, radius scale, and convenience maps used by wrapper components.
 *
 * Usage:
 *   import { DS_PALETTE, DS_Z, DS_RADIUS, statusColorMap } from '@/lib/design-system';
 */

// Re-export the palette & Ant Design bridge
export { DS_PALETTE, antdTheme, antdDarkTheme } from '@/lib/theme/antd-theme';

// ============================================================================
// Z-INDEX SCALE (mirrors --ds-z-* custom properties)
// ============================================================================

export const DS_Z = {
    base: 0,
    raised: 10,
    dropdown: 20,
    sticky: 30,
    header: 40,
    overlay: 50,
    modal: 60,
    toast: 70,
} as const;

// ============================================================================
// BORDER-RADIUS SCALE (mirrors --ds-radius-* custom properties)
// ============================================================================

export const DS_RADIUS = {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
} as const;

// ============================================================================
// SHADOW TOKENS (mirrors --ds-shadow-* custom properties)
// ============================================================================

export const DS_SHADOW = {
    xs: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)',
    sm: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
    md: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.08)',
    xl: '0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.08)',
    elevated: '0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05)',
} as const;

// ============================================================================
// STATUS / SEMANTIC COLOR MAPS (for runtime JS — e.g. Ant Design tag colors)
// ============================================================================

/**
 * Maps common status strings to Tailwind token classes.
 * Used by StatusBadge and anywhere a status needs a color.
 */
export const statusColorMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    // Order / general statuses
    active: { bg: 'bg-ds-status-success-bg', text: 'text-ds-status-success-text', border: 'border-ds-status-success', dot: 'bg-ds-status-success' },
    approved: { bg: 'bg-ds-status-success-bg', text: 'text-ds-status-success-text', border: 'border-ds-status-success', dot: 'bg-ds-status-success' },
    completed: { bg: 'bg-ds-status-success-bg', text: 'text-ds-status-success-text', border: 'border-ds-status-success', dot: 'bg-ds-status-success' },
    delivered: { bg: 'bg-ds-status-success-bg', text: 'text-ds-status-success-text', border: 'border-ds-status-success', dot: 'bg-ds-status-success' },
    success: { bg: 'bg-ds-status-success-bg', text: 'text-ds-status-success-text', border: 'border-ds-status-success', dot: 'bg-ds-status-success' },
    verified: { bg: 'bg-ds-status-success-bg', text: 'text-ds-status-success-text', border: 'border-ds-status-success', dot: 'bg-ds-status-success' },

    pending: { bg: 'bg-ds-status-warning-bg', text: 'text-ds-status-warning-text', border: 'border-ds-status-warning', dot: 'bg-ds-status-warning' },
    processing: { bg: 'bg-ds-status-warning-bg', text: 'text-ds-status-warning-text', border: 'border-ds-status-warning', dot: 'bg-ds-status-warning' },
    warning: { bg: 'bg-ds-status-warning-bg', text: 'text-ds-status-warning-text', border: 'border-ds-status-warning', dot: 'bg-ds-status-warning' },
    shipped: { bg: 'bg-ds-status-warning-bg', text: 'text-ds-status-warning-text', border: 'border-ds-status-warning', dot: 'bg-ds-status-warning' },
    'ready for pickup': { bg: 'bg-ds-status-warning-bg', text: 'text-ds-status-warning-text', border: 'border-ds-status-warning', dot: 'bg-ds-status-warning' },
    'in transit': { bg: 'bg-ds-status-warning-bg', text: 'text-ds-status-warning-text', border: 'border-ds-status-warning', dot: 'bg-ds-status-warning' },
    'low stock': { bg: 'bg-ds-status-warning-bg', text: 'text-ds-status-warning-text', border: 'border-ds-status-warning', dot: 'bg-ds-status-warning' },

    cancelled: { bg: 'bg-ds-status-error-bg', text: 'text-ds-status-error-text', border: 'border-ds-status-error', dot: 'bg-ds-status-error' },
    declined: { bg: 'bg-ds-status-error-bg', text: 'text-ds-status-error-text', border: 'border-ds-status-error', dot: 'bg-ds-status-error' },
    error: { bg: 'bg-ds-status-error-bg', text: 'text-ds-status-error-text', border: 'border-ds-status-error', dot: 'bg-ds-status-error' },
    failed: { bg: 'bg-ds-status-error-bg', text: 'text-ds-status-error-text', border: 'border-ds-status-error', dot: 'bg-ds-status-error' },
    rejected: { bg: 'bg-ds-status-error-bg', text: 'text-ds-status-error-text', border: 'border-ds-status-error', dot: 'bg-ds-status-error' },
    suspended: { bg: 'bg-ds-status-error-bg', text: 'text-ds-status-error-text', border: 'border-ds-status-error', dot: 'bg-ds-status-error' },
    'out of stock': { bg: 'bg-ds-status-error-bg', text: 'text-ds-status-error-text', border: 'border-ds-status-error', dot: 'bg-ds-status-error' },
    refunded: { bg: 'bg-ds-status-error-bg', text: 'text-ds-status-error-text', border: 'border-ds-status-error', dot: 'bg-ds-status-error' },
    banned: { bg: 'bg-ds-status-error-bg', text: 'text-ds-status-error-text', border: 'border-ds-status-error', dot: 'bg-ds-status-error' },
    inactive: { bg: 'bg-ds-status-error-bg', text: 'text-ds-status-error-text', border: 'border-ds-status-error', dot: 'bg-ds-status-error' },

    info: { bg: 'bg-ds-status-info-bg', text: 'text-ds-status-info-text', border: 'border-ds-status-info', dot: 'bg-ds-status-info' },
    draft: { bg: 'bg-ds-status-info-bg', text: 'text-ds-status-info-text', border: 'border-ds-status-info', dot: 'bg-ds-status-info' },
    'in stock': { bg: 'bg-ds-status-success-bg', text: 'text-ds-status-success-text', border: 'border-ds-status-success', dot: 'bg-ds-status-success' },

    // Roles
    admin: { bg: 'bg-ds-brand-surface', text: 'text-ds-text-brand', border: 'border-ds-border-brand', dot: 'bg-ds-brand-primary' },
    vendor: { bg: 'bg-ds-status-info-bg', text: 'text-ds-status-info-text', border: 'border-ds-status-info', dot: 'bg-ds-status-info' },
    buyer: { bg: 'bg-ds-status-success-bg', text: 'text-ds-status-success-text', border: 'border-ds-status-success', dot: 'bg-ds-status-success' },

    // Fallback
    default: { bg: 'bg-ds-surface-sunken', text: 'text-ds-text-secondary', border: 'border-ds-border-base', dot: 'bg-ds-text-tertiary' },
};

/**
 * Resolve a status string to its color tokens. Case-insensitive, with fallback.
 */
export function getStatusColors(status: string) {
    return statusColorMap[status.toLowerCase()] ?? statusColorMap.default;
}

// ============================================================================
// PASSWORD STRENGTH COLORS (maps strength levels to design-system tokens)
// Replaces ad-hoc hex values like #DC3545, #FFB02E, etc.
// ============================================================================

export const passwordStrengthColors: Record<string, { hex: string; twClass: string }> = {
    weak: { hex: '#ef4444', twClass: 'bg-ds-status-error' },
    fair: { hex: '#f59e0b', twClass: 'bg-ds-status-warning' },
    good: { hex: '#3b82f6', twClass: 'bg-ds-status-info' },
    strong: { hex: '#22c55e', twClass: 'bg-ds-status-success' },
    veryStrong: { hex: '#9333ea', twClass: 'bg-ds-brand-primary' },
};
