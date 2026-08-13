/**
 * Single source of truth for paginated editor page dimensions.
 * All pagination logic and page-sheet CSS must derive from these values.
 */
export const PAGE_GEOMETRY = {
  /** Total white page sheet width in px */
  width: 920,
  /** Total white page sheet height in px (fixed, never grows with content) */
  height: 1056,
  /** Padding on all four sides inside the white sheet */
  padding: 48,
  /** Visible grey gap between page sheets */
  gap: 32,
} as const;

/** Usable vertical area for document content inside one page */
export const PAGE_CONTENT_HEIGHT =
  PAGE_GEOMETRY.height - PAGE_GEOMETRY.padding * 2;

export const PAGE_CSS_VARS = {
  '--page-width': `${PAGE_GEOMETRY.width}px`,
  '--page-height': `${PAGE_GEOMETRY.height}px`,
  '--page-padding': `${PAGE_GEOMETRY.padding}px`,
  '--page-gap': `${PAGE_GEOMETRY.gap}px`,
  '--page-content-height': `${PAGE_CONTENT_HEIGHT}px`,
} as const;
