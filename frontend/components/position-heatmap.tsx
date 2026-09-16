'use client';

import { useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import type { Position } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

function getPnlColor(pplPercent: number): string {
  if (pplPercent >= 10) return '#059669';
  if (pplPercent >= 5) return '#10b981';
  if (pplPercent >= 0) return '#34d399';
  if (pplPercent >= -5) return '#fb7185';
  if (pplPercent >= -10) return '#f43f5e';
  return '#e11d48';
}

function CustomContent(props: any) {
  const { x, y, width, height, name, pplPercent } = props;
  if (width < 30 || height < 25 || pplPercent === undefined) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={getPnlColor(pplPercent ?? 0)}
        stroke="rgba(10,10,26,0.8)"
        strokeWidth={2}
      />
      {width > 50 && height > 35 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 6}
            textAnchor="middle"
            fill="white"
            fontSize={width > 80 ? 12 : 10}
            fontWeight="600"
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="rgba(255,255,255,0.8)"
            fontSize={10}
          >
            {pplPercent >= 0 ? '+' : ''}
            {pplPercent.toFixed(1)}%
          </text>
        </>
      )}
    </g>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#1a1a2e', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, padding: '10px 14px', zIndex: 50 }}>
      <p style={{ color: '#f0f0f0', fontSize: 13, fontWeight: 600 }}>{d.fullName}</p>
      <div style={{ marginTop: 4, display: 'flex', gap: 12 }}>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>
          Value: {formatCurrency(d.size)}
        </span>
        <span style={{ color: d.pplPercent >= 0 ? '#10b981' : '#f43f5e', fontSize: 12, fontWeight: 600 }}>
          {d.pplPercent >= 0 ? '+' : ''}{d.pplPercent?.toFixed(2)}%
        </span>
      </div>
      <span style={{ color: '#64748b', fontSize: 11 }}>
        P&L: {formatCurrency(d.ppl)}
      </span>
    </div>
  );
}

export default function PositionHeatmap({
  positions,
}: {
  positions: Position[];
}) {
  const data = useMemo(() => {
    return positions
      .filter((p) => p.walletImpact.currentValue > 0)
      .map((p) => ({
        name: p.instrument.name.split(' ')[0],
        fullName: p.instrument.name,
        size: p.walletImpact.currentValue,
        ppl: p.walletImpact.unrealizedProfitLoss,
        pplPercent:
          p.averagePricePaid > 0
            ? ((p.currentPrice - p.averagePricePaid) / p.averagePricePaid) * 100
            : 0,
      }))
      .sort((a, b) => b.size - a.size);
  }, [positions]);

  if (data.length === 0) {
    return (
      <div className="glass-card flex h-64 items-center justify-center rounded-xl p-6">
        <p className="text-text-muted">No positions to display</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Position Heatmap</h2>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded"
              style={{ backgroundColor: '#059669' }}
            />
            Gain
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded"
              style={{ backgroundColor: '#e11d48' }}
            />
            Loss
          </span>
          <span className="text-text-muted">Size = allocation</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <Treemap
          data={data}
          dataKey="size"
          stroke="none"
          content={<CustomContent />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
