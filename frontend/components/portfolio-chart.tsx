'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { Snapshot } from '@/lib/types';
import { formatCurrencyShort } from '@/lib/format';
import { usePrivacy } from '@/lib/privacy';

const RANGES = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'ALL', days: 0 },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload, label, hidden }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg border border-border-glow px-4 py-3">
      <p className="text-xs text-text-muted">
        {new Date(label).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>
      <p className={`mt-1 font-heading text-lg font-bold text-cyan ${hidden ? 'select-none blur-md' : ''}`}>
        {formatCurrencyShort(payload[0].value)}
      </p>
    </div>
  );
}

export default function PortfolioChart({
  snapshots,
}: {
  snapshots: Snapshot[];
}) {
  const { hidden } = usePrivacy();
  const [range, setRange] = useState('ALL');

  const filtered = useMemo(() => {
    const r = RANGES.find((r) => r.label === range);
    if (!r || r.days === 0) return snapshots;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - r.days);
    return snapshots.filter((s) => new Date(s.takenAt) >= cutoff);
  }, [snapshots, range]);

  const data = filtered.map((s) => ({
    date: s.takenAt,
    value: s.totalValue,
  }));

  const minValue = data.length
    ? Math.min(...data.map((d) => d.value)) * 0.98
    : 0;
  const maxValue = data.length
    ? Math.max(...data.map((d) => d.value)) * 1.02
    : 100;

  if (data.length === 0) {
    return (
      <div className="glass-card flex h-80 items-center justify-center rounded-xl p-6">
        <p className="text-text-muted">
          No snapshot data yet. Snapshots are taken automatically based on your
          configured interval.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Portfolio Value</h2>
        <div className="flex gap-1 rounded-lg bg-bg-card p-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.label)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r.label
                  ? 'bg-cyan/15 text-cyan'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="rgba(255,255,255,0.1)"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[minValue, maxValue]}
            tickFormatter={(v: number) => hidden ? '***' : formatCurrencyShort(v)}
            stroke="rgba(255,255,255,0.1)"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip content={<CustomTooltip hidden={hidden} />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#00d4ff"
            strokeWidth={2}
            fill="url(#chartGradient)"
            dot={false}
            activeDot={{
              r: 5,
              fill: '#00d4ff',
              stroke: '#0a0a1a',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
