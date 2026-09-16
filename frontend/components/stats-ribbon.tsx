'use client';

import type { Position, AccountSummary } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface Props {
  summary: AccountSummary;
  positions: Position[];
}

export default function StatsRibbon({ summary, positions }: Props) {
  const totalPositions = positions.length;

  const best = positions.reduce(
    (max, p) =>
      p.walletImpact.unrealizedProfitLoss >
      (max?.walletImpact.unrealizedProfitLoss ?? -Infinity)
        ? p
        : max,
    positions[0],
  );

  const worst = positions.reduce(
    (min, p) =>
      p.walletImpact.unrealizedProfitLoss <
      (min?.walletImpact.unrealizedProfitLoss ?? Infinity)
        ? p
        : min,
    positions[0],
  );

  const currencies = new Set(positions.map((p) => p.instrument.currency));

  const avgHoldingDays =
    positions.length > 0
      ? Math.round(
          positions.reduce((sum, p) => {
            const days = Math.floor(
              (Date.now() - new Date(p.createdAt).getTime()) /
                (1000 * 60 * 60 * 24),
            );
            return sum + days;
          }, 0) / positions.length,
        )
      : 0;

  const stats = [
    {
      label: 'Positions',
      value: String(totalPositions),
      color: 'text-cyan',
    },
    {
      label: 'Currencies',
      value: String(currencies.size),
      color: 'text-violet',
    },
    {
      label: 'Avg Hold',
      value: `${avgHoldingDays}d`,
      color: 'text-text-primary',
    },
    {
      label: 'Best',
      value: best ? best.instrument.name.split(' ')[0] : '-',
      sub: best
        ? formatCurrency(best.walletImpact.unrealizedProfitLoss)
        : '',
      color: 'text-emerald',
    },
    {
      label: 'Worst',
      value: worst ? worst.instrument.name.split(' ')[0] : '-',
      sub: worst
        ? formatCurrency(worst.walletImpact.unrealizedProfitLoss)
        : '',
      color: 'text-rose',
    },
    {
      label: 'Realized P&L',
      value: formatCurrency(summary.investments.realizedProfitLoss, 'EUR', true),
      color:
        summary.investments.realizedProfitLoss >= 0
          ? 'text-emerald'
          : 'text-rose',
    },
  ];

  return (
    <div className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-xl px-6 py-3">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{stat.label}</span>
          <span className={`text-sm font-semibold ${stat.color}`}>
            {stat.value}
          </span>
          {stat.sub && (
            <span className={`text-xs ${stat.color}`}>{stat.sub}</span>
          )}
        </div>
      ))}
    </div>
  );
}
