import type { ThemeConfig } from 'antd';

/**
 * Ant Design theme configuration for HarvestHub
 * Using neon purple as primary color (#9333ea / #a855f7)
 */
export const antdTheme: ThemeConfig = {
    token: {
        // Primary colors - Neon Purple
        colorPrimary: '#9333ea',
        colorPrimaryHover: '#a855f7',
        colorPrimaryActive: '#7e22ce',
        colorLink: '#a855f7',
        colorLinkHover: '#9333ea',

        // Success, Warning, Error, Info
        colorSuccess: '#22c55e',
        colorWarning: '#f59e0b',
        colorError: '#ef4444',
        colorInfo: '#3b82f6',

        // Typography
        fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: 14,
        fontSizeHeading1: 32,
        fontSizeHeading2: 28,
        fontSizeHeading3: 24,
        fontSizeHeading4: 20,
        fontSizeHeading5: 16,

        // Border radius
        borderRadius: 8,
        borderRadiusLG: 12,
        borderRadiusSM: 6,
        borderRadiusXS: 4,

        // Spacing
        padding: 16,
        paddingLG: 24,
        paddingSM: 12,
        paddingXS: 8,

        // Shadows
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    },

    components: {
        Button: {
            primaryShadow: '0 2px 0 rgba(147, 51, 234, 0.1)',
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
            borderRadiusLG: 12,
            boxShadowTertiary: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        },

        Table: {
            headerBg: '#faf5ff',
            headerColor: '#3b0764',
            rowHoverBg: '#faf5ff',
        },

        Modal: {
            borderRadiusLG: 12,
            headerBg: '#faf5ff',
        },

        Select: {
            controlHeight: 40,
            controlHeightLG: 48,
            controlHeightSM: 32,
        },

        Pagination: {
            itemActiveBg: '#9333ea',
            itemLinkBg: '#ffffff',
        },

        Menu: {
            itemSelectedBg: '#f3e8ff',
            itemSelectedColor: '#7e22ce',
            itemHoverBg: '#faf5ff',
        },

        Carousel: {
            dotWidth: 10,
            dotHeight: 10,
            dotActiveWidth: 24,
        },
    },
};

/**
 * Dark mode theme configuration
 */
export const antdDarkTheme: ThemeConfig = {
    ...antdTheme,
    token: {
        ...antdTheme.token,
        colorBgBase: '#0f0f0f',
        colorBgContainer: '#1a1a1a',
        colorBgElevated: '#262626',
        colorBorder: '#333333',
        colorText: '#e5e5e5',
        colorTextSecondary: '#a3a3a3',
    },
    components: {
        ...antdTheme.components,
        Table: {
            headerBg: '#262626',
            headerColor: '#e5e5e5',
            rowHoverBg: '#333333',
        },
        Modal: {
            borderRadiusLG: 12,
            headerBg: '#262626',
        },
        Menu: {
            itemSelectedBg: '#3b0764',
            itemSelectedColor: '#d8b4fe',
            itemHoverBg: '#262626',
        },
    },
};
