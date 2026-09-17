'use client';

import { useMemo } from 'react';
import type { Position } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { Blur } from '@/lib/privacy';

const CURRENCY_COLORS: Record<string, string> = {
  EUR: '#00d4ff',
  USD: '#8b5cf6',
  GBP: '#10b981',
  CHF: '#f59e0b',
  JPY: '#f43f5e',
};

function getColor(currency: string): string {
  return CURRENCY_COLORS[currency] || '#64748b';
}

export default function CurrencyExposure({
  positions,
}: {
  positions: Position[];
}) {
  const data = useMemo(() => {
    const totals = new Map<string, number>();
    for (const p of positions) {
      const curr = p.instrument.currency;
      totals.set(curr, (totals.get(curr) || 0) + p.walletImpact.currentValue);
    }
    const total = Array.from(totals.values()).reduce((s, v) => s + v, 0);
    return Array.from(totals.entries())
      .map(([currency, value]) => ({
        currency,
        value,
        percent: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [positions]);

  if (data.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="mb-4 font-heading text-lg font-semibold">
        Currency Exposure
      </h2>

      <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-bg-card">
        {data.map((d) => (
          <div
            key={d.currency}
            style={{
              width: `${d.percent}%`,
              backgroundColor: getColor(d.currency),
            }}
            className="transition-all duration-500"
          />
        ))}
      </div>

      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.currency} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: getColor(d.currency) }}
              />
              <span className="text-sm font-medium">{d.currency}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary">
                <Blur>{formatCurrency(d.value)}</Blur>
              </span>
              <span className="w-14 text-right text-sm font-semibold text-text-muted">
                {d.percent.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
