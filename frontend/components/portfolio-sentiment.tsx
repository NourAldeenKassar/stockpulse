'use client';

import Link from 'next/link';
import type { MarketOverview } from '@/lib/types';
import { Button, Card, LocalTime, SectionHeading } from '@/components/ui';
import { RATING_SCALE as RATINGS, SEGMENT_GAP } from '@/lib/rating-palette';

/** Net score from -100 (all strong sell) to +100 (all strong buy). */
function netScore(t: MarketOverview['sentiment']): number {
  if (!t) return 0;
  return (
    t.strongBuy * 1 +
    t.buy * 0.5 +
    t.hold * 0 +
    t.sell * -0.5 +
    t.strongSell * -1
  );
}

function verdict(score: number): { label: string; tone: string } {
  if (score >= 50) return { label: 'Strongly positive', tone: 'text-emerald' };
  if (score >= 20) return { label: 'Positive', tone: 'text-emerald' };
  if (score >= -20) return { label: 'Mixed', tone: 'text-text-secondary' };
  if (score >= -50) return { label: 'Negative', tone: 'text-rose' };
  return { label: 'Strongly negative', tone: 'text-rose' };
}

export default function PortfolioSentiment({
  overview,
  accountId,
  onRefresh,
}: {
  overview: MarketOverview;
  accountId: string;
  onRefresh?: () => void;
}) {
  const t = overview.sentiment;
  const score = netScore(t);
  const v = verdict(score);

  const rated = overview.holdings
    .filter((h) => h.consensus && h.consensus.total > 0)
    .sort((a, b) => b.weight - a.weight);

  return (
    <Card>
      <SectionHeading
        action={
          <span className="flex items-center gap-2 text-xs text-text-muted">
            {overview.covered} of {overview.total} covered
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                Refresh
              </Button>
            )}
          </span>
        }
      >
        Analyst sentiment
      </SectionHeading>

      {!t ? (
        <p className="text-sm text-text-muted">
          None of your holdings have analyst coverage. Funds and ETFs generally
          do not, and smaller non-US listings often cannot be matched.
        </p>
      ) : (
        <>
          <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className={`font-heading text-2xl font-bold ${v.tone}`}>
              {v.label}
            </span>
            <span className="text-sm text-text-secondary">
              across {overview.covered} rated{' '}
              {overview.covered === 1 ? 'holding' : 'holdings'}
            </span>
          </div>
          <p className="mb-4 text-xs text-text-muted">
            Weighted by position size, so your largest holdings count most
          </p>

          <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-bg-card">
            {RATINGS.map((r) => {
              const value = t[r.key];
              if (value <= 0.5) return null;
              return (
                <div
                  key={r.key}
                  style={{
                    width: `${value}%`,
                    backgroundColor: r.color,
                    borderRight: `${SEGMENT_GAP} solid var(--color-bg)`,
                  }}
                  title={`${r.label}: ${value.toFixed(0)}%`}
                />
              );
            })}
          </div>

          <div className="mb-6 flex flex-wrap gap-x-5 gap-y-1.5">
            {RATINGS.map((r) => (
              <span
                key={r.key}
                className="flex items-center gap-1.5 text-xs text-text-secondary"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: r.color }}
                />
                <span className="hidden sm:inline">{r.label}</span>
                <span className="sm:hidden">{r.short}</span>
                <span className="font-semibold text-text-primary">
                  {t[r.key].toFixed(0)}%
                </span>
              </span>
            ))}
          </div>
        </>
      )}

      {rated.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
            By holding
          </p>
          {rated.map((h) => {
            const c = h.consensus!;
            const bullish = ((c.strongBuy + c.buy) / c.total) * 100;
            return (
              <Link
                key={h.ticker}
                href={`/stocks/${encodeURIComponent(h.ticker)}?account=${accountId}`}
                className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-card-hover"
              >
                <span className="w-28 shrink-0 truncate text-sm font-medium transition-colors group-hover:text-cyan sm:w-40">
                  {h.name}
                </span>
                <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-bg-card">
                  {RATINGS.map((r) => {
                    const value = c[r.key];
                    if (value === 0) return null;
                    return (
                      <div
                        key={r.key}
                        style={{
                          width: `${(value / c.total) * 100}%`,
                          backgroundColor: r.color,
                          borderRight: `${SEGMENT_GAP} solid var(--color-bg)`,
                        }}
                      />
                    );
                  })}
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-text-muted">
                  {bullish.toFixed(0)}% buy
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-5 border-t border-border pt-3 text-[11px] text-text-muted">
        Source: Finnhub analyst recommendation counts · cached, fetched{' '}
        <LocalTime iso={overview.fetchedAt} />
      </p>
    </Card>
  );
}
