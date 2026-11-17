/**
 * Models wrap JSON in markdown fences despite being told not to, so strip them
 * before parsing. Returns null rather than throwing: a malformed reply is an
 * expected outcome, not an exceptional one.
 */
export function parseJsonFromLlm<T>(raw: string | null): T | null {
  if (!raw) return null;

  const content = raw
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  if (!content) return null;

  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}
