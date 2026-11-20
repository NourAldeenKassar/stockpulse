const LEGAL_SUFFIXES = [
  'nv',
  'bv',
  'se',
  'sa',
  'ag',
  'plc',
  'ltd',
  'limited',
  'inc',
  'incorporated',
  'corp',
  'corporation',
  'co',
  'company',
  'holding',
  'holdings',
  'group',
  'the',
];

/** Lowercases, drops punctuation and strips legal-form words. */
export function normaliseCompanyName(name: string): string {
  const words = name
    .toLowerCase()
    // Dots and apostrophes are dropped rather than split on, so "N.V."
    // collapses to "nv" instead of two meaningless single letters.
    .replace(/[.']/g, '')
    .replace(/[,"&()\-/]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !LEGAL_SUFFIXES.includes(word));

  return words.join(' ');
}

/**
 * Whether two names describe the same company.
 *
 * Used to confirm that a base symbol really belongs to the instrument we hold
 * before borrowing its analyst coverage. A loose match here would attach
 * another company's ratings to the position, so this only accepts an exact
 * match once legal forms and punctuation are removed.
 */
export function namesMatch(a: string, b: string): boolean {
  const left = normaliseCompanyName(a);
  const right = normaliseCompanyName(b);
  if (!left || !right) return false;
  return left === right;
}
