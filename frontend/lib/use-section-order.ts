'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { createLocalStore } from './local-store';

export const DEFAULT_ORDER = [
  'summary',
  'stats',
  'health-insights',
  'heatmap',
  'chart',
  'allocation-row',
  'sentiment',
  'earnings',
  'news',
  'simulator',
  'positions',
];

export const SECTION_LABELS: Record<string, string> = {
  summary: 'Summary Cards',
  stats: 'Stats Ribbon',
  'health-insights': 'Health + Insights',
  heatmap: 'Heatmap',
  chart: 'Portfolio Chart',
  'allocation-row': 'Allocation / Currency / Movers',
  sentiment: 'Analyst Sentiment',
  earnings: 'Earnings',
  news: 'News',
  simulator: 'What-If Simulator',
  positions: 'Positions Table',
};

const store = createLocalStore('dashboard-section-order');

/** Keeps known sections in the stored order and appends any new ones. */
function parseOrder(raw: string | null): string[] {
  if (!raw) return DEFAULT_ORDER;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_ORDER;
    const valid = parsed.filter(
      (id): id is string =>
        typeof id === 'string' && DEFAULT_ORDER.includes(id),
    );
    const missing = DEFAULT_ORDER.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  } catch {
    return DEFAULT_ORDER;
  }
}

export function useSectionOrder() {
  const raw = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const order = useMemo(() => parseOrder(raw), [raw]);

  const setOrder = useCallback((next: string[]) => {
    store.set(JSON.stringify(next));
  }, []);

  const reset = useCallback(() => {
    store.set(JSON.stringify(DEFAULT_ORDER));
  }, []);

  return { order, setOrder, reset };
}
