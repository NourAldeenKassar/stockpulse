'use client';

import type { AccountSummary } from '@/lib/types';
import { formatCurrency, formatPercentOf } from '@/lib/format';

interface SummaryCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  glowClass: string;
  valueClass?: string;
}

function SummaryCard({
  label,
  value,
  subValue,
  icon,
  glowClass,
  valueClass,
}: SummaryCardProps) {
  return (
    <div className={`glass-card ${glowClass} rounded-xl p-5`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-card">
          {icon}
        </div>
      </div>
      <p
        className={`font-heading text-2xl font-bold tracking-tight ${valueClass || 'text-text-primary'}`}
      >
        {value}
      </p>
      {subValue && <p className="mt-1 text-sm text-text-muted">{subValue}</p>}
    </div>
  );
}

export default function PortfolioSummary({
  summary,
}: {
  summary: AccountSummary;
}) {
  const cashAvailable = summary.cash.availableToTrade;
  const invested = summary.investments.totalCost;
  const ppl = summary.investments.unrealizedProfitLoss;
  const pplPositive = ppl >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        label="Total Value"
        value={formatCurrency(summary.totalValue)}
        icon={
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-cyan)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M16 8h-6a2 2 0 100 4h4a2 2 0 010 4H8" />
            <path d="M12 18V6" />
          </svg>
        }
        glowClass="glow-cyan"
      />

      <SummaryCard
        label="Cash Available"
        value={formatCurrency(cashAvailable)}
        subValue={formatPercentOf(cashAvailable, summary.totalValue) + ' of portfolio'}
        icon={
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-violet)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="2" />
            <path d="M6 12h.01M18 12h.01" />
          </svg>
        }
        glowClass=""
      />

      <SummaryCard
        label="Invested"
        value={formatCurrency(invested)}
        subValue={
          formatPercentOf(invested, summary.totalValue) + ' of portfolio'
        }
        icon={
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-cyan)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
            <polyline points="16,7 22,7 22,13" />
          </svg>
        }
        glowClass=""
      />

      <SummaryCard
        label="Unrealized P&L"
        value={formatCurrency(ppl)}
        subValue={
          formatPercentOf(Math.abs(ppl), invested) +
          (pplPositive ? ' gain' : ' loss')
        }
        icon={
          pplPositive ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-emerald)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18,15 12,9 6,15" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-rose)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6,9 12,15 18,9" />
            </svg>
          )
        }
        glowClass={pplPositive ? 'glow-emerald' : 'glow-rose'}
        valueClass={pplPositive ? 'text-positive' : 'text-negative'}
      />
    </div>
  );
}
