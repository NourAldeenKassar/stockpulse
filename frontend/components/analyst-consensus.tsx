'use client';

import { useMemo } from 'react';
import type { AnalystConsensus, RecommendationTrend } from '@/lib/types';
import { Card, LocalTime, SectionHeading } from '@/components/ui';
import { RATING_SCALE as RATINGS, SEGMENT_GAP } from '@/lib/rating-palette';

function total(trend: RecommendationTrend): number {
  return RATINGS.reduce((sum, r) => sum + (trend[r.key] || 0), 0);
}

/**
 * Formats 2026-11-01 as "Nov 2026". Finnhub periods are date-only, so they
 * parse as UTC midnight; formatting in UTC keeps the month correct for viewers
 * behind UTC and keeps server and client output identical.
 */
function formatPeriod(period: string): string {
  const date = new Date(period);
  if (Number.isNaN(date.getTime())) return period;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function AnalystConsensusPanel({
  consensus,
}: {
  consensus: AnalystConsensus;
}) {
  const latest = consensus.trends[0];
  const count = useMemo(() => (latest ? total(latest) : 0), [latest]);

  if (!latest || count === 0) return null;

  return (
    <Card>
      <SectionHeading
        action={
          <span className="text-xs text-text-muted">
            {consensus.trends.length} months
          </span>
        }
      >
        Analyst consensus
      </SectionHeading>

      <div className="mb-1 flex items-baseline gap-2">
        <span className="font-heading text-2xl font-bold">{count}</span>
        <span className="text-sm text-text-secondary">
          analysts covering {consensus.symbol}
        </span>
      </div>
      <p className="mb-4 text-xs text-text-muted">
        {formatPeriod(latest.period)}
      </p>

      <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-bg-card">
        {RATINGS.map((r) => {
          const value = latest[r.key] || 0;
          if (value === 0) return null;
          return (
            <div
              key={r.key}
              style={{
                width: `${(value / count) * 100}%`,
                backgroundColor: r.color,
                borderRight: `${SEGMENT_GAP} solid var(--color-bg)`,
              }}
              title={`${r.label}: ${value}`}
            />
          );
        })}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
        {RATINGS.map((r) => (
          <div key={r.key} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-text-secondary">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: r.color }}
              />
              {r.label}
            </span>
            <span className="text-xs font-semibold">{latest[r.key] || 0}</span>
          </div>
        ))}
      </div>

      {consensus.trends.length > 1 && (
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Recent months
          </p>
          <div className="space-y-1.5">
            {consensus.trends.map((trend) => {
              const t = total(trend);
              if (t === 0) return null;
              return (
                <div key={trend.period} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-[11px] text-text-muted">
                    {formatPeriod(trend.period)}
                  </span>
                  <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-bg-card">
                    {RATINGS.map((r) => {
                      const value = trend[r.key] || 0;
                      if (value === 0) return null;
                      return (
                        <div
                          key={r.key}
                          style={{
                            width: `${(value / t) * 100}%`,
                            backgroundColor: r.color,
                            borderRight: `${SEGMENT_GAP} solid var(--color-bg)`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-5 border-t border-border pt-3 text-[11px] text-text-muted">
        Source: Finnhub · fetched <LocalTime iso={consensus.fetchedAt} />
        {consensus.industry ? ` · ${consensus.industry}` : ''}
      </p>
    </Card>
  );
}
