'use client';

import { useState, useMemo } from 'react';
import type { Position } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/format';

type SortKey =
  | 'ticker'
  | 'quantity'
  | 'averagePrice'
  | 'currentPrice'
  | 'ppl'
  | 'pplPercent'
  | 'allocation';
type SortDir = 'asc' | 'desc';

interface Props {
  positions: Position[];
}

export default function PositionsTable({ positions }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('allocation');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');

  const totalValue = positions.reduce(
    (sum, p) => sum + p.walletImpact.currentValue,
    0,
  );

  const enriched = useMemo(() => {
    return positions.map((p) => ({
      ...p,
      ticker: p.instrument.ticker,
      name: p.instrument.name,
      ppl: p.walletImpact.unrealizedProfitLoss,
      marketValue: p.walletImpact.currentValue,
      pplPercent:
        p.averagePricePaid > 0
          ? ((p.currentPrice - p.averagePricePaid) / p.averagePricePaid) * 100
          : 0,
      allocation:
        totalValue > 0
          ? (p.walletImpact.currentValue / totalValue) * 100
          : 0,
    }));
  }, [positions, totalValue]);

  const filtered = useMemo(() => {
    let items = enriched;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.ticker.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q),
      );
    }
    items.sort((a, b) => {
      let va: number, vb: number;
      switch (sortKey) {
        case 'ticker':
          return sortDir === 'asc'
            ? a.ticker.localeCompare(b.ticker)
            : b.ticker.localeCompare(a.ticker);
        case 'quantity':
          va = a.quantity;
          vb = b.quantity;
          break;
        case 'averagePrice':
          va = a.averagePricePaid;
          vb = b.averagePricePaid;
          break;
        case 'currentPrice':
          va = a.currentPrice;
          vb = b.currentPrice;
          break;
        case 'ppl':
          va = a.ppl;
          vb = b.ppl;
          break;
        case 'pplPercent':
          va = a.pplPercent;
          vb = b.pplPercent;
          break;
        case 'allocation':
          va = a.allocation;
          vb = b.allocation;
          break;
        default:
          va = 0;
          vb = 0;
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return items;
  }, [enriched, search, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortHeader({ label, field }: { label: string; field: SortKey }) {
    const active = sortKey === field;
    return (
      <th
        onClick={() => handleSort(field)}
        className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted transition-colors hover:text-text-secondary"
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active && (
            <span className="text-cyan">
              {sortDir === 'asc' ? '\u25B2' : '\u25BC'}
            </span>
          )}
        </span>
      </th>
    );
  }

  return (
    <div className="glass-card overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="font-heading text-lg font-semibold">Positions</h2>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search ticker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 rounded-lg py-2 pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-text-muted">
            {positions.length === 0
              ? 'No positions found'
              : 'No matching positions'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <SortHeader label="Ticker" field="ticker" />
                <SortHeader label="Qty" field="quantity" />
                <SortHeader label="Avg Price" field="averagePrice" />
                <SortHeader label="Price" field="currentPrice" />
                <SortHeader label="P&L" field="ppl" />
                <SortHeader label="P&L %" field="pplPercent" />
                <SortHeader label="Alloc %" field="allocation" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.ticker}
                  className="border-b border-border transition-colors hover:bg-bg-card-hover"
                >
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-sm font-semibold">
                        {p.name}
                      </span>
                      <span className="ml-2 font-mono text-xs text-text-muted">
                        {p.ticker}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {p.quantity.toFixed(p.quantity % 1 === 0 ? 0 : 4)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {formatCurrency(p.averagePricePaid)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-primary">
                    {formatCurrency(p.currentPrice)}
                  </td>
                  <td
                    className={`px-4 py-3 text-sm font-medium ${p.ppl >= 0 ? 'text-positive' : 'text-negative'}`}
                  >
                    {formatCurrency(p.ppl)}
                  </td>
                  <td
                    className={`px-4 py-3 text-sm font-medium ${p.pplPercent >= 0 ? 'text-positive' : 'text-negative'}`}
                  >
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                        p.pplPercent >= 0 ? 'bg-positive' : 'bg-negative'
                      }`}
                    >
                      {formatPercent(p.pplPercent)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {p.allocation.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
