'use client';

import type { EarningsItem } from '@/lib/types';
import { Card, SectionHeading } from '@/components/ui';

export default function StockEarnings({
  earnings,
  currency,
}: {
  earnings: EarningsItem[];
  /** Reporting currency for the EPS figures, when known. */
  currency?: string | null;
}) {
  if (earnings.length === 0) return null;

  return (
    <Card>
      <SectionHeading
        action={
          <span className="text-xs text-text-muted">EPS vs estimate</span>
        }
      >
        Earnings
      </SectionHeading>

      <div className="space-y-2">
        {earnings.map((e) => {
          const beat = (e.surprisePercent ?? 0) >= 0;
          const tone = beat ? 'text-emerald' : 'text-rose';
          const bg = beat ? 'bg-emerald/10' : 'bg-rose/10';
          return (
            <div
              key={e.period}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5"
            >
              <span className="text-sm font-medium">{e.period}</span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-text-muted">
                  est {e.estimate ?? '—'}
                </span>
                <span className="text-sm font-semibold">{e.actual ?? '—'}</span>
                {e.surprisePercent !== null && (
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${bg} ${tone}`}
                  >
                    {beat ? '+' : ''}
                    {e.surprisePercent.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
