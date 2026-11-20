'use client';

import type { AccountSummary } from '@/lib/types';
import { formatCurrency, formatPercentOf } from '@/lib/format';
import { Blur } from '@/lib/privacy';
import { Card, cn } from '@/components/ui';

interface SummaryCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  glowClass: string;
  valueClass?: string;
  /** The one figure the page is about, given its own weight. */
  hero?: boolean;
}

function SummaryCard({
  label,
  value,
  subValue,
  icon,
  glowClass,
  valueClass,
  hero,
}: SummaryCardProps) {
  return (
    <Card
      tone={hero ? 'prominent' : 'default'}
      padding={hero ? 'lg' : 'sm'}
      className={cn(hero && glowClass, hero && 'sm:col-span-2 lg:row-span-2')}
    >
      <div
        className={cn(
          'flex items-center justify-between',
          hero ? 'mb-4' : 'mb-2.5',
        )}
      >
        <span
          className={cn(
            'font-medium',
            hero
              ? 'text-body text-text-secondary'
              : 'text-caption text-text-muted',
          )}
        >
          {label}
        </span>
        <div
          className={cn(
            'flex items-center justify-center rounded-lg bg-bg-card',
            hero ? 'h-10 w-10' : 'h-8 w-8',
          )}
        >
          {icon}
        </div>
      </div>
      <p
        className={cn(
          'font-heading font-bold tracking-tight',
          // The hero number is the focal point, so it is allowed to break the
          // four-step scale. Everything else stays on it.
          hero ? 'text-[2.25rem] leading-[2.6rem]' : 'text-heading',
          valueClass || 'text-text-primary',
        )}
      >
        <Blur>{value}</Blur>
      </p>
      {subValue && (
        <p
          className={cn(
            'mt-1 text-caption',
            hero ? 'text-text-secondary' : 'text-text-muted',
          )}
        >
          <Blur>{subValue}</Blur>
        </p>
      )}
    </Card>
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
        hero
        label="Total Value"
        value={formatCurrency(summary.totalValue)}
        subValue={`${formatPercentOf(invested, summary.totalValue)} invested · ${formatPercentOf(cashAvailable, summary.totalValue)} cash`}
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
        subValue={
          formatPercentOf(cashAvailable, summary.totalValue) + ' of portfolio'
        }
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
