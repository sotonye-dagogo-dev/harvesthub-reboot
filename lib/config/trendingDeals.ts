/**
 * Trending & Deals Configuration
 *
 * Centralises scoring inputs and deal-eligibility windows so that
 * trending product selection and deal visibility can be tuned
 * without changing business logic across multiple files.
 */

export const TRENDING_CONFIG = {
  /** Max products returned by the trending API endpoint */
  defaultLimit: 10,

  /** Weight applied to sales volume in composite score */
  salesWeight: 0.6,

  /** Weight applied to average rating contribution */
  ratingWeight: 0.25,

  /** Weight applied to recency (products added within newnessDays are boosted) */
  recencyWeight: 0.15,

  /** Number of days within which a product is still considered "new" for recency boost */
  newnessDays: 30,

  /** Cache TTL in seconds for the trending endpoint */
  cacheTtlSeconds: 300,
} as const;

export const DEALS_CONFIG = {
  /**
   * Minimum discount percentage to be shown in the Deals section.
   * A product must have discount >= this value to qualify.
   */
  minDiscountPercent: 5,

  /** Max deals shown in the home page deals strip */
  homePageLimit: 12,

  /** Cache TTL in seconds for the deals endpoint */
  cacheTtlSeconds: 180,
} as const;

export type TrendingConfig = typeof TRENDING_CONFIG;
export type DealsConfig = typeof DEALS_CONFIG;
