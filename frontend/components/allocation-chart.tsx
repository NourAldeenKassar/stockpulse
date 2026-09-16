'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Position } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

const COLORS = [
  '#00d4ff',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#06b6d4',
  '#a78bfa',
  '#34d399',
  '#fbbf24',
  '#fb7185',
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="glass-card rounded-lg border border-border-glow px-3 py-2">
      <p className="text-sm font-medium text-text-primary">{d.name}</p>
      <p className="text-xs text-text-muted">
        {formatCurrency(d.value)} ({d.payload.percent.toFixed(1)}%)
      </p>
    </div>
  );
}

export default function AllocationChart({
  positions,
}: {
  positions: Position[];
}) {
  const data = useMemo(() => {
    const totalValue = positions.reduce(
      (s, p) => s + p.walletImpact.currentValue,
      0,
    );
    const items = positions
      .map((p) => ({
        name: p.instrument.name,
        value: p.walletImpact.currentValue,
        percent:
          totalValue > 0
            ? (p.walletImpact.currentValue / totalValue) * 100
            : 0,
      }))
      .sort((a, b) => b.value - a.value);

    if (items.length <= 10) return items;

    const top = items.slice(0, 9);
    const rest = items.slice(9);
    const otherValue = rest.reduce((s, i) => s + i.value, 0);
    const otherPercent = rest.reduce((s, i) => s + i.percent, 0);
    return [
      ...top,
      { name: 'Other', value: otherValue, percent: otherPercent },
    ];
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
      <h2 className="mb-4 font-heading text-lg font-semibold">Allocation</h2>
      <div className="flex items-center gap-6">
        <div className="h-52 w-52 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {data.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-xs text-text-secondary">
                {item.name}{' '}
                <span className="text-text-muted">
                  {item.percent.toFixed(1)}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
