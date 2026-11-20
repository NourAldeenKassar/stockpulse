'use client';

import Link from 'next/link';
import type { MarketOverview } from '@/lib/types';
import { Card, SectionHeading } from '@/components/ui';

export default function PortfolioEarnings({
  overview,
  accountId,
}: {
  overview: MarketOverview;
  accountId: string;
}) {
  const withEarnings = overview.holdings
    .filter((h) => h.latestEarnings)
    .sort((a, b) =>
      (b.latestEarnings?.period ?? '').localeCompare(
        a.latestEarnings?.period ?? '',
      ),
    );

  if (withEarnings.length === 0) return null;

  return (
    <Card>
      <SectionHeading
        action={
          <span className="text-caption text-text-muted">
            most recent quarter
          </span>
        }
      >
        Earnings per share
      </SectionHeading>

      <p className="mb-4 text-caption text-text-muted">
        Reported EPS against what analysts expected. These are per-share
        figures, not totals.
      </p>

      <div className="space-y-2">
        {withEarnings.map((h) => {
          const e = h.latestEarnings!;
          const surprise = e.surprisePercent;
          const beat = (surprise ?? 0) >= 0;
          const tone = beat ? 'text-emerald' : 'text-rose';
          const bg = beat ? 'bg-emerald/10' : 'bg-rose/10';
          return (
            <Link
              key={h.ticker}
              href={`/stocks/${encodeURIComponent(h.ticker)}?account=${accountId}`}
              className="group flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-border-glow hover:bg-bg-card-hover sm:px-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium transition-colors group-hover:text-cyan">
                  {h.name}
                </p>
                <p className="text-caption text-text-muted">{e.period}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-caption text-text-muted">
                  est {e.estimate ?? '—'}
                </span>
                <span className="text-body font-semibold">
                  {e.actual ?? '—'}
                  <span className="ml-1 text-caption font-normal text-text-muted">
                    {h.reportingCurrency ? `${h.reportingCurrency} ` : ''}EPS
                  </span>
                </span>
                {surprise !== null && (
                  <span
                    className={`rounded px-2 py-0.5 text-caption font-bold ${bg} ${tone}`}
                  >
                    {beat ? '+' : ''}
                    {surprise.toFixed(1)}%
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
