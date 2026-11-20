/**
 * Diverging palette for analyst ratings: two hues either side of a neutral
 * grey midpoint, with a saturated pole and a pale inner step on each side.
 *
 * Adjacent steps must stay far enough apart to be told apart. These measure
 * ΔE 25.3 in normal vision and 20.6 under simulated colour-vision deficiency,
 * against a floor of 15. Re-measure before changing any of them; two greens a
 * shade apart look fine in isolation and are indistinguishable side by side.
 *
 * The grey midpoint reads as grey on purpose: that is what makes it diverging
 * rather than categorical.
 */
export const RATING_SCALE = [
  { key: 'strongBuy', label: 'Strong buy', short: 'S.Buy', color: '#059669' },
  { key: 'buy', label: 'Buy', short: 'Buy', color: '#86efac' },
  { key: 'hold', label: 'Hold', short: 'Hold', color: '#64748b' },
  { key: 'sell', label: 'Sell', short: 'Sell', color: '#fda4af' },
  {
    key: 'strongSell',
    label: 'Strong sell',
    short: 'S.Sell',
    color: '#e11d48',
  },
] as const;

export type RatingKey = (typeof RATING_SCALE)[number]['key'];

/**
 * Stacked segments butt directly against each other, so a thin surface-coloured
 * gap keeps adjacent fills legible. Applied as a border rather than a margin so
 * percentage widths still sum to 100.
 */
export const SEGMENT_GAP = '2px';

/**
 * The same diverging scale applied to profit and loss.
 *
 * The neutral band around zero is load-bearing: without it the two inner steps
 * measure ΔE 1.0 under simulated deuteranopia, making a small gain and a small
 * loss the same colour to a red-green colourblind reader.
 *
 * `text` accompanies each step because the pale fills cannot carry white
 * labels.
 */
export function pnlColor(percent: number): { fill: string; text: string } {
  const dark = '#0a0a1a';
  if (percent >= 10) return { fill: '#059669', text: '#ffffff' };
  if (percent >= 3) return { fill: '#86efac', text: dark };
  if (percent > -3) return { fill: '#64748b', text: '#ffffff' };
  if (percent > -10) return { fill: '#fda4af', text: dark };
  return { fill: '#e11d48', text: '#ffffff' };
}
