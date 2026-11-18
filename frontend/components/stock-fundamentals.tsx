'use client';

import type { Fundamentals } from '@/lib/types';
import { Card, SectionHeading } from '@/components/ui';

function fmt(value: number | null, suffix = '', digits = 2): string {
  if (value === null) return '—';
  return `${value.toFixed(digits)}${suffix}`;
}

function marketCap(value: number | null): string {
  if (value === null) return '—';
  // Finnhub reports market cap in millions.
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}T`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}B`;
  return `${value.toFixed(0)}M`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs text-text-muted">{label}</p>
      <p className="font-heading text-base font-semibold">{value}</p>
    </div>
  );
}

export default function StockFundamentals({
  fundamentals,
  currentPrice,
  priceCurrency,
}: {
  fundamentals: Fundamentals;
  currentPrice: number;
  /** Currency of currentPrice, from Trading212. */
  priceCurrency: string;
}) {
  const { week52High: high, week52Low: low } = fundamentals;

  // Trading212 quotes the position in its own listing's currency while these
  // figures come from Finnhub's listing. Plotting one against the other when
  // they disagree would put the marker somewhere confidently wrong, so the
  // range is shown as plain numbers unless the currencies match.
  const comparable =
    fundamentals.currency !== null &&
    fundamentals.currency.toUpperCase() === priceCurrency.toUpperCase();

  const position =
    comparable && high !== null && low !== null && high > low
      ? Math.min(100, Math.max(0, ((currentPrice - low) / (high - low)) * 100))
      : null;

  return (
    <Card>
      <SectionHeading>Fundamentals</SectionHeading>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="P/E (TTM)" value={fmt(fundamentals.peRatio)} />
        <Metric label="P/B" value={fmt(fundamentals.pbRatio)} />
        <Metric label="Beta" value={fmt(fundamentals.beta)} />
        <Metric
          label="Dividend yield"
          value={fmt(fundamentals.dividendYield, '%')}
        />
        <Metric label="Market cap" value={marketCap(fundamentals.marketCap)} />
        <Metric
          label="Gross margin"
          value={fmt(fundamentals.grossMargin, '%', 1)}
        />
        <Metric
          label="Net margin"
          value={fmt(fundamentals.netMargin, '%', 1)}
        />
        <Metric
          label="Return on equity"
          value={fmt(fundamentals.returnOnEquity, '%', 1)}
        />
      </div>

      {position === null && high !== null && low !== null && (
        <div className="mt-6 flex items-center justify-between text-xs text-text-muted">
          <span>52-week low {fmt(low)}</span>
          <span>
            {fundamentals.currency && fundamentals.currency !== priceCurrency
              ? `quoted in ${fundamentals.currency}, your position in ${priceCurrency}`
              : ''}
          </span>
          <span>52-week high {fmt(high)}</span>
        </div>
      )}

      {position !== null && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
            <span>52-week low {fmt(low)}</span>
            <span>52-week high {fmt(high)}</span>
          </div>
          <div className="relative h-1.5 rounded-full bg-bg-card">
            <div
              className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-bg bg-cyan"
              style={{ left: `${position}%` }}
              title={`Current price ${currentPrice}`}
            />
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Currently {position.toFixed(0)}% of the way up its 52-week range
          </p>
        </div>
      )}

      <p className="mt-5 border-t border-border pt-3 text-[11px] text-text-muted">
        Source: Finnhub · a dash means the figure was not covered
      </p>
    </Card>
  );
}
