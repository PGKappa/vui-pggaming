/** Retail kiosk viewport constraints */
export const RETAIL_VIEWPORT = {
  MIN_WIDTH: 1280,
  MAX_WIDTH: 1920,
  HEIGHT: 1020,
  SCROLL_THRESHOLD: 1080,
  /** Exact height that uses the original fixed layout (no adaptive changes) */
  ORIGINAL_HEIGHT: 1080,
  /** Original main content row height */
  PAGE_CONTENT_HEIGHT: 945,
  /**
   * At/below this height (with width ≤1280 for the exact 720 boundary) the page
   * uses a single scrollbar with original layout sizes.
   */
  BETSLIP_SCROLL_THRESHOLD: 720,
  /** Original betting slip column height */
  BETSLIP_HEIGHT: 950,
  BETSLIP_WIDTH: 400,
  /** Space reserved above the FASTBET bar (matches drawer mb-16) */
  DRAWER_BOTTOM_OFFSET: 64,
  /** Top clearance for amount drawer at full height */
  DRAWER_TOP_OFFSET: 96,
  /** Top clearance for FASTBET drawer at full height (below navbar + carousel) */
  FASTBET_DRAWER_TOP_OFFSET: 196,
  /** Top clearance for drawers at compact height (navbar only) */
  COMPACT_DRAWER_TOP_OFFSET: 64,
} as const
