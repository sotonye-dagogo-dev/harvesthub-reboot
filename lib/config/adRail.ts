export const AD_RAIL_CONFIG = {
  desktop: {
    maxHeightClass: "ad-rail-desktop-max-height",
    gapClass: "ad-rail-desktop-gap",
    autoScroll: {
      stepPx: 112,
      intervalMs: 2400,
    },
  },
  mobile: {
    gapClass: "ad-rail-mobile-gap",
    tileWidthClass: "ad-rail-mobile-tile-width",
    autoScroll: {
      stepPx: 132,
      intervalMs: 2600,
    },
  },
  interactionPauseMs: 5000,
} as const;

export type AdRailConfig = typeof AD_RAIL_CONFIG;
