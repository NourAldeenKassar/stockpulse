/**
 * The type scale in pixels, for places that cannot use a class.
 *
 * Charts set font sizes as SVG attributes and inline styles, so they would
 * otherwise drift away from the rest of the interface. These must stay in step
 * with the --text-* tokens in globals.css.
 */
export const CAPTION_PX = 12;
export const BODY_PX = 14;
export const HEADING_PX = 18;
export const DISPLAY_PX = 24;
