'use client';

import { useMemo } from 'react';
import type { Position } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/format';

export default function TopMovers({ positions }: { positions: Position[] }) {
  const { gainers, losers } = useMemo(() => {
    const withPercent = positions.map((p) => ({
      ...p,
      ticker: p.instrument.ticker,
      name: p.instrument.name,
      ppl: p.walletImpact.unrealizedProfitLoss,
      pplPercent:
        p.averagePricePaid > 0
          ? ((p.currentPrice - p.averagePricePaid) / p.averagePricePaid) * 100
          : 0,
    }));

    const sorted = [...withPercent].sort((a, b) => b.pplPercent - a.pplPercent);
    return {
      gainers: sorted.filter((p) => p.pplPercent > 0).slice(0, 3),
      losers: sorted
        .filter((p) => p.pplPercent < 0)
        .slice(-3)
        .reverse(),
    };
  }, [positions]);

  if (positions.length === 0) {
    return (
      <div className="glass-card flex h-full items-center justify-center rounded-xl p-6">
        <p className="text-text-muted">No positions</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="mb-4 font-heading text-lg font-semibold">Top Movers</h2>

      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-emerald">
            Top Gainers
          </p>
          <div className="space-y-2">
            {gainers.length === 0 ? (
              <p className="text-sm text-text-muted">No gainers</p>
            ) : (
              gainers.map((p) => (
                <div
                  key={p.ticker}
                  className="flex items-center justify-between rounded-lg bg-emerald-glow px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-semibold">
                      {p.name}
                    </span>
                    <span className="ml-2 text-xs text-text-muted">
                      {formatCurrency(p.ppl)}
                    </span>
                  </div>
                  <span className="rounded bg-emerald/15 px-2 py-0.5 text-xs font-bold text-emerald">
                    {formatPercent(p.pplPercent)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-rose">
            Top Losers
          </p>
          <div className="space-y-2">
            {losers.length === 0 ? (
              <p className="text-sm text-text-muted">No losers</p>
            ) : (
              losers.map((p) => (
                <div
                  key={p.ticker}
                  className="flex items-center justify-between rounded-lg bg-rose-glow px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-semibold">
                      {p.name}
                    </span>
                    <span className="ml-2 text-xs text-text-muted">
                      {formatCurrency(p.ppl)}
                    </span>
                  </div>
                  <span className="rounded bg-rose/15 px-2 py-0.5 text-xs font-bold text-rose">
                    {formatPercent(p.pplPercent)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
