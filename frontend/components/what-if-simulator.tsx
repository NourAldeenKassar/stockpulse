'use client';

import { useState, useMemo } from 'react';
import type { Position } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { Blur } from '@/lib/privacy';

export default function WhatIfSimulator({
  positions,
}: {
  positions: Position[];
}) {
  const [selectedTicker, setSelectedTicker] = useState('');
  const [priceChange, setPriceChange] = useState(0);

  const sorted = useMemo(
    () =>
      [...positions].sort(
        (a, b) => b.walletImpact.currentValue - a.walletImpact.currentValue,
      ),
    [positions],
  );

  const selected = sorted.find((p) => p.instrument.ticker === selectedTicker);

  const impact = useMemo(() => {
    if (!selected) return null;
    const currentValue = selected.walletImpact.currentValue;
    const newPrice = selected.currentPrice * (1 + priceChange / 100);
    const newValue = newPrice * selected.quantity;
    const valueDiff = newValue - currentValue;
    const totalPortfolio = positions.reduce(
      (s, p) => s + p.walletImpact.currentValue,
      0,
    );
    const portfolioImpact = totalPortfolio > 0 ? (valueDiff / totalPortfolio) * 100 : 0;

    return {
      currentPrice: selected.currentPrice,
      newPrice,
      currentValue,
      newValue,
      valueDiff,
      portfolioImpact,
    };
  }, [selected, priceChange, positions]);

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="mb-4 font-heading text-lg font-semibold">
        What-If Simulator
      </h2>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-text-secondary">
            Select Position
          </label>
          <select
            value={selectedTicker}
            onChange={(e) => {
              setSelectedTicker(e.target.value);
              setPriceChange(0);
            }}
            className="w-full rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Choose a position...</option>
            {sorted.map((p) => (
              <option key={p.instrument.ticker} value={p.instrument.ticker}>
                {p.instrument.name} ({formatCurrency(p.walletImpact.currentValue)})
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs text-text-secondary">
                  Price Change
                </label>
                <span
                  className={`font-mono text-lg font-bold ${
                    priceChange >= 0 ? 'text-emerald' : 'text-rose'
                  }`}
                >
                  {priceChange >= 0 ? '+' : ''}
                  {priceChange}%
                </span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                step={1}
                value={priceChange}
                onChange={(e) => setPriceChange(Number(e.target.value))}
                className="w-full accent-cyan"
              />
              <div className="mt-1 flex justify-between text-[10px] text-text-muted">
                <span>-50%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>

            {impact && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-bg-card p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    New Price
                  </p>
                  <p className="font-mono text-sm font-semibold">
                    {formatCurrency(impact.newPrice)}
                  </p>
                  <p className="text-xs text-text-muted">
                    from {formatCurrency(impact.currentPrice)}
                  </p>
                </div>
                <div className="rounded-lg bg-bg-card p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    New Value
                  </p>
                  <p className="font-mono text-sm font-semibold">
                    <Blur>{formatCurrency(impact.newValue)}</Blur>
                  </p>
                  <p className="text-xs text-text-muted">
                    from <Blur>{formatCurrency(impact.currentValue)}</Blur>
                  </p>
                </div>
                <div className="rounded-lg bg-bg-card p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    P&L Impact
                  </p>
                  <p
                    className={`font-mono text-sm font-bold ${impact.valueDiff >= 0 ? 'text-emerald' : 'text-rose'}`}
                  >
                    <Blur>
                      {impact.valueDiff >= 0 ? '+' : ''}
                      {formatCurrency(impact.valueDiff)}
                    </Blur>
                  </p>
                </div>
                <div className="rounded-lg bg-bg-card p-3">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    Portfolio Impact
                  </p>
                  <p
                    className={`font-mono text-sm font-bold ${impact.portfolioImpact >= 0 ? 'text-emerald' : 'text-rose'}`}
                  >
                    <Blur>
                      {impact.portfolioImpact >= 0 ? '+' : ''}
                      {impact.portfolioImpact.toFixed(2)}%
                    </Blur>
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {!selected && (
          <p className="py-4 text-center text-sm text-text-muted">
            Select a position to simulate price changes
          </p>
        )}
      </div>
    </div>
  );
}
