'use client';

import { useHydrated } from '@/lib/use-hydrated';

type Mode = 'datetime' | 'date';

/** Deterministic, timezone-free fallback for the server render. */
function isoFallback(iso: string, mode: Mode): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = date.toISOString().slice(0, 10);
  if (mode === 'date') return day;
  return `${day} ${date.toISOString().slice(11, 16)} UTC`;
}

/**
 * Dates formatted with toLocaleString render in the server's timezone during
 * SSR and the viewer's afterwards, which is a guaranteed hydration mismatch.
 * This renders a stable UTC string on the server and swaps to the viewer's
 * local format once hydrated.
 */
export default function LocalTime({
  iso,
  mode = 'datetime',
}: {
  iso: string | null | undefined;
  mode?: Mode;
}) {
  const hydrated = useHydrated();
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return <>{iso}</>;

  if (!hydrated) return <>{isoFallback(iso, mode)}</>;

  return (
    <>{mode === 'date' ? date.toLocaleDateString() : date.toLocaleString()}</>
  );
}
