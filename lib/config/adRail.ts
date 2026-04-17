export const AD_RAIL_CONFIG = {
  desktop: {
    maxHeightClass: "lg:max-h-[300px] xl:max-h-[332px]",
    gapClass: "gap-1.5",
    autoScroll: {
      stepPx: 112,
      intervalMs: 2400,
    },
  },
  mobile: {
    gapClass: "gap-1.5",
    tileWidthClass: "w-28 sm:w-32",
    autoScroll: {
      stepPx: 132,
      intervalMs: 2600,
    },
  },
  interactionPauseMs: 5000,
} as const;

export type AdRailConfig = typeof AD_RAIL_CONFIG;
