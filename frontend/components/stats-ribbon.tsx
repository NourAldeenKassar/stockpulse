'use client';

import type { Position, AccountSummary } from '@/lib/types';
import { averageHoldingDays } from '@/lib/metrics';
import { formatCurrency } from '@/lib/format';
import { Blur } from '@/lib/privacy';

interface Props {
  summary: AccountSummary;
  positions: Position[];
  /** When the data was fetched. Avoids calling Date.now() during render. */
  asOf: number;
}

export default function StatsRibbon({ summary, positions, asOf }: Props) {
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

  const avgHoldingDays = averageHoldingDays(positions, asOf);

  const stats = [
    {
      label: 'Positions',
      value: String(totalPositions),
      color: 'text-cyan',
      sensitive: false,
    },
    {
      label: 'Currencies',
      value: String(currencies.size),
      color: 'text-violet',
      sensitive: false,
    },
    {
      label: 'Avg Hold',
      value: `${avgHoldingDays}d`,
      color: 'text-text-primary',
      sensitive: false,
    },
    {
      label: 'Best',
      value: best ? best.instrument.name.split(' ')[0] : '-',
      sub: best ? formatCurrency(best.walletImpact.unrealizedProfitLoss) : '',
      color: 'text-emerald',
      sensitive: true,
    },
    {
      label: 'Worst',
      value: worst ? worst.instrument.name.split(' ')[0] : '-',
      sub: worst ? formatCurrency(worst.walletImpact.unrealizedProfitLoss) : '',
      color: 'text-rose',
      sensitive: true,
    },
    {
      label: 'Realized P&L',
      value: formatCurrency(
        summary.investments.realizedProfitLoss,
        'EUR',
        true,
      ),
      color:
        summary.investments.realizedProfitLoss >= 0
          ? 'text-emerald'
          : 'text-rose',
      sensitive: true,
    },
  ];

  return (
    <div className="surface flex flex-wrap items-center justify-between gap-4 rounded-xl px-6 py-3">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-2">
          <span className="text-caption text-text-muted">{stat.label}</span>
          <span className={`text-body font-semibold ${stat.color}`}>
            {stat.sensitive ? <Blur>{stat.value}</Blur> : stat.value}
          </span>
          {stat.sub && (
            <span className={`text-caption ${stat.color}`}>
              {stat.sensitive ? <Blur>{stat.sub}</Blur> : stat.sub}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
