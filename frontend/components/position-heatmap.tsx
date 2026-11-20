'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import type { Position } from '@/lib/types';
import { pplPercent } from '@/lib/metrics';
import { pnlColor } from '@/lib/rating-palette';
import { BODY_PX, CAPTION_PX } from '@/lib/type-scale';
import { formatCurrency } from '@/lib/format';

function CustomContent(props: any) {
  const { x, y, width, height, name, pplPercent, ticker, onSelect } = props;
  if (width < 30 || height < 25 || pplPercent === undefined) return null;

  const clickable = Boolean(ticker && onSelect);

  return (
    <g
      onClick={clickable ? () => onSelect(ticker) : undefined}
      style={clickable ? { cursor: 'pointer' } : undefined}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={pnlColor(pplPercent ?? 0).fill}
        stroke="rgba(10,10,26,0.8)"
        strokeWidth={2}
      />
      {width > 50 && height > 35 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 6}
            textAnchor="middle"
            fill={pnlColor(pplPercent ?? 0).text}
            fontSize={CAPTION_PX}
            fontWeight="600"
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill={pnlColor(pplPercent ?? 0).text}
            fontSize={CAPTION_PX}
            opacity={0.85}
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
    <div
      style={{
        background: '#1a1a2e',
        border: '1px solid rgba(0,212,255,0.2)',
        borderRadius: 8,
        padding: '10px 14px',
        zIndex: 50,
      }}
    >
      <p style={{ color: '#f0f0f0', fontSize: BODY_PX, fontWeight: 600 }}>
        {d.fullName}
      </p>
      <div style={{ marginTop: 4, display: 'flex', gap: 12 }}>
        <span style={{ color: '#94a3b8', fontSize: CAPTION_PX }}>
          Value: {formatCurrency(d.size)}
        </span>
        <span
          style={{
            color: d.pplPercent >= 0 ? '#10b981' : '#f43f5e',
            fontSize: CAPTION_PX,
            fontWeight: 600,
          }}
        >
          {d.pplPercent >= 0 ? '+' : ''}
          {d.pplPercent?.toFixed(2)}%
        </span>
      </div>
      <span style={{ color: '#64748b', fontSize: CAPTION_PX }}>
        P&L: {formatCurrency(d.ppl)}
      </span>
    </div>
  );
}

export default function PositionHeatmap({
  positions,
  accountId,
}: {
  positions: Position[];
  /** Enables click-through to the per-stock analysis page. */
  accountId?: string;
}) {
  const router = useRouter();
  const data = useMemo(() => {
    return positions
      .filter((p) => p.walletImpact.currentValue > 0)
      .map((p) => ({
        name: p.instrument.name.split(' ')[0],
        fullName: p.instrument.name,
        ticker: p.instrument.ticker,
        size: p.walletImpact.currentValue,
        ppl: p.walletImpact.unrealizedProfitLoss,
        pplPercent: pplPercent(p),
      }))
      .sort((a, b) => b.size - a.size);
  }, [positions]);

  if (data.length === 0) {
    return (
      <div className="surface flex h-64 items-center justify-center rounded-xl p-5 sm:p-6">
        <p className="text-text-muted">No positions to display</p>
      </div>
    );
  }

  return (
    <div className="surface rounded-xl p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-heading font-semibold">
          Position Heatmap
        </h2>
        <div className="flex items-center gap-2 text-caption text-text-muted">
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
          content={
            <CustomContent
              onSelect={
                accountId
                  ? (ticker: string) =>
                      router.push(
                        `/stocks/${encodeURIComponent(ticker)}?account=${accountId}`,
                      )
                  : undefined
              }
            />
          }
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
