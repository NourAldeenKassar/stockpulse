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

/**
 * Merges a saved order with the current section list.
 *
 * Sections the user has never seen are placed where DEFAULT_ORDER puts them
 * relative to the sections they do have, rather than appended at the end.
 * Appending buried newly added sections below the positions table, where
 * nobody would scroll to find them.
 */
export function mergeOrder(stored: string[]): string[] {
  const result = stored.filter((id) => DEFAULT_ORDER.includes(id));

  DEFAULT_ORDER.forEach((id, index) => {
    if (result.includes(id)) return;

    // Anchor to the nearest earlier default section the user already has.
    let insertAt = 0;
    for (let i = index - 1; i >= 0; i--) {
      const found = result.indexOf(DEFAULT_ORDER[i]);
      if (found !== -1) {
        insertAt = found + 1;
        break;
      }
    }
    result.splice(insertAt, 0, id);
  });

  return result;
}

function parseOrder(raw: string | null): string[] {
  if (!raw) return DEFAULT_ORDER;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_ORDER;
    return mergeOrder(
      parsed.filter((id): id is string => typeof id === 'string'),
    );
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
