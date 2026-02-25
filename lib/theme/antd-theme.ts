import type { ThemeConfig } from 'antd';

// ============================================================================
// Design-System → Ant Design Theme Bridge
//
// These hex values MUST stay in sync with the CSS custom properties defined in
// app/_styles/globals.css (Tier 1 palette). The single source of truth is the
// palette layer; this file is the bridge that feeds Ant Design's JS-based
// theme engine (which cannot consume CSS variables at build time).
//
// To keep them aligned the design-system index re-exports `DS_PALETTE` which
// is used here and can be used in any runtime code that needs raw hex values.
// ============================================================================

/**
 * Raw palette values (hex). Keep in sync with --ds-palette-* in globals.css.
 * Exported so the design-system index can re-export them for runtime use.
 */
export const DS_PALETTE = {
    purple: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7e22ce',
        800: '#6b21a8',
        900: '#581c87',
        950: '#3b0764',
    },
    neutral: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#e5e5e5',
        300: '#d4d4d4',
        400: '#a3a3a3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#1a1a1a',
        950: '#0f0f0f',
    },
    green: { 50: '#f0fdf4', 100: '#dcfce7', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 800: '#166534', 900: '#052e16' },
    red: { 50: '#fef2f2', 100: '#fee2e2', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 800: '#991b1b', 900: '#450a0a' },
    amber: { 50: '#fffbeb', 100: '#fef3c7', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 800: '#92400e', 900: '#451a03' },
    blue: { 50: '#eff6ff', 100: '#dbeafe', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 800: '#1e40af', 900: '#0e1a3f' },
    yellow: { 400: '#facc15', 500: '#eab308' },
    white: '#ffffff',
    black: '#060606',
} as const;

/** Shadow tokens (keep in sync with --ds-shadow-*) */
const DS_SHADOW = {
    xs: '0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02)',
    elevated: '0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05)',
};

/** Border-radius tokens */
const DS_RADIUS = { xs: 4, sm: 6, md: 8, lg: 12, xl: 16 };

/**
 * Light theme configuration for Ant Design
 */
export const antdTheme: ThemeConfig = {
    token: {
        // Brand
        colorPrimary: DS_PALETTE.purple[600],
        colorPrimaryHover: DS_PALETTE.purple[500],
        colorPrimaryActive: DS_PALETTE.purple[700],
        colorLink: DS_PALETTE.purple[500],
        colorLinkHover: DS_PALETTE.purple[600],

        // Status
        colorSuccess: DS_PALETTE.green[500],
        colorWarning: DS_PALETTE.amber[500],
        colorError: DS_PALETTE.red[500],
        colorInfo: DS_PALETTE.blue[500],

        // Typography
        fontFamily:
            'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: 14,
        fontSizeHeading1: 32,
        fontSizeHeading2: 28,
        fontSizeHeading3: 24,
        fontSizeHeading4: 20,
        fontSizeHeading5: 16,

        // Radius
        borderRadius: DS_RADIUS.md,
        borderRadiusLG: DS_RADIUS.lg,
        borderRadiusSM: DS_RADIUS.sm,
        borderRadiusXS: DS_RADIUS.xs,

        // Spacing
        padding: 16,
        paddingLG: 24,
        paddingSM: 12,
        paddingXS: 8,

        // Shadows
        boxShadow: DS_SHADOW.xs,
        boxShadowSecondary: DS_SHADOW.elevated,
    },

    components: {
        Button: {
            primaryShadow: `0 2px 0 rgba(147, 51, 234, 0.1)`,
            controlHeight: 40,
            controlHeightLG: 48,
            controlHeightSM: 32,
            fontWeight: 600,
        },
        Input: {
            controlHeight: 40,
            controlHeightLG: 48,
            controlHeightSM: 32,
            paddingBlock: 8,
            paddingInline: 12,
        },
        Card: {
            borderRadiusLG: DS_RADIUS.lg,
            boxShadowTertiary: DS_SHADOW.xs,
        },
        Table: {
            headerBg: DS_PALETTE.purple[50],
            headerColor: DS_PALETTE.purple[950],
            rowHoverBg: DS_PALETTE.purple[50],
        },
        Modal: {
            borderRadiusLG: DS_RADIUS.lg,
            headerBg: DS_PALETTE.purple[50],
        },
        Select: {
            controlHeight: 40,
            controlHeightLG: 48,
            controlHeightSM: 32,
        },
        Pagination: {
            itemActiveBg: DS_PALETTE.purple[600],
            itemLinkBg: DS_PALETTE.white,
        },
        Menu: {
            itemSelectedBg: DS_PALETTE.purple[100],
            itemSelectedColor: DS_PALETTE.purple[700],
            itemHoverBg: DS_PALETTE.purple[50],
        },
        Carousel: {
            dotWidth: 10,
            dotHeight: 10,
            dotActiveWidth: 24,
        },
    },
};

/**
 * Dark theme configuration for Ant Design
 */
export const antdDarkTheme: ThemeConfig = {
    ...antdTheme,
    token: {
        ...antdTheme.token,
        colorBgBase: DS_PALETTE.neutral[950],
        colorBgContainer: DS_PALETTE.neutral[900],
        colorBgElevated: DS_PALETTE.neutral[800],
        colorBorder: DS_PALETTE.neutral[700],
        colorText: DS_PALETTE.neutral[200],
        colorTextSecondary: DS_PALETTE.neutral[400],
    },
    components: {
        ...antdTheme.components,
        Table: {
            headerBg: DS_PALETTE.neutral[800],
            headerColor: DS_PALETTE.neutral[200],
            rowHoverBg: DS_PALETTE.neutral[700],
        },
        Modal: {
            borderRadiusLG: DS_RADIUS.lg,
            headerBg: DS_PALETTE.neutral[800],
        },
        Menu: {
            itemSelectedBg: DS_PALETTE.purple[950],
            itemSelectedColor: DS_PALETTE.purple[300],
            itemHoverBg: DS_PALETTE.neutral[800],
        },
    },
};
