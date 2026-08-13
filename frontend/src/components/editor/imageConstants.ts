import { PAGE_GEOMETRY } from './pageGeometry';

/** Usable horizontal content width inside a page sheet. */
export const PAGE_CONTENT_WIDTH =
  PAGE_GEOMETRY.width - PAGE_GEOMETRY.padding * 2;

export type ImageAlign = 'left' | 'center' | 'right';
export type ImageBorderStyle = 'none' | 'solid' | 'dashed' | 'dotted';
export type ImageSpacing = 'none' | 'small' | 'medium' | 'large';

export const IMAGE_SPACING_MARGIN: Record<ImageSpacing, string> = {
  none: '0',
  small: '0.5rem',
  medium: '1rem',
  large: '1.5rem',
};

export const IMAGE_BORDER_WIDTHS = ['0', '1', '2', '3', '4'] as const;
export const IMAGE_BORDER_STYLES: ImageBorderStyle[] = ['none', 'solid', 'dashed', 'dotted'];
export const IMAGE_RADIUS_OPTIONS = ['0', '4px', '8px', '12px', '16px'] as const;

export const ACCEPTED_IMAGE_TYPES =
  'image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml';
