'use client';

import { useMemo } from 'react';
import type { Position, AccountSummary } from '@/lib/types';

interface ScoreBreakdown {
  label: string;
  score: number;
  maxScore: number;
  detail: string;
}

function calculateHealth(
  summary: AccountSummary,
  positions: Position[],
): { total: number; breakdown: ScoreBreakdown[] } {
  const breakdown: ScoreBreakdown[] = [];
  const totalValue = summary.totalValue;

  // 1. Diversification (0-25): more positions = better, up to 10+
  const posCount = positions.length;
  const divScore = Math.min(25, Math.round((posCount / 10) * 25));
  breakdown.push({
    label: 'Diversification',
    score: divScore,
    maxScore: 25,
    detail: `${posCount} position${posCount !== 1 ? 's' : ''}`,
  });

  // 2. Concentration risk (0-25): top position should be <30%
  const topAlloc =
    positions.length > 0
      ? Math.max(
          ...positions.map(
            (p) => (p.walletImpact.currentValue / totalValue) * 100,
          ),
        )
      : 0;
  let concScore = 25;
  if (topAlloc > 50) concScore = 5;
  else if (topAlloc > 40) concScore = 10;
  else if (topAlloc > 30) concScore = 15;
  else if (topAlloc > 20) concScore = 20;
  breakdown.push({
    label: 'Concentration',
    score: concScore,
    maxScore: 25,
    detail: `Top: ${topAlloc.toFixed(0)}%`,
  });

  // 3. Cash ratio (0-25): 5-15% cash is healthy
  const cashPercent =
    totalValue > 0 ? (summary.cash.availableToTrade / totalValue) * 100 : 0;
  let cashScore = 25;
  if (cashPercent < 2) cashScore = 10;
  else if (cashPercent < 5) cashScore = 18;
  else if (cashPercent > 30) cashScore = 10;
  else if (cashPercent > 20) cashScore = 15;
  breakdown.push({
    label: 'Cash Buffer',
    score: cashScore,
    maxScore: 25,
    detail: `${cashPercent.toFixed(1)}% cash`,
  });

  // 4. Currency diversity (0-25): multiple currencies = better
  const currencies = new Set(positions.map((p) => p.instrument.currency));
  const currScore = Math.min(25, currencies.size * 8);
  breakdown.push({
    label: 'Currency Mix',
    score: currScore,
    maxScore: 25,
    detail: `${currencies.size} currenc${currencies.size !== 1 ? 'ies' : 'y'}`,
  });

  const total = breakdown.reduce((s, b) => s + b.score, 0);
  return { total, breakdown };
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--color-emerald)';
  if (score >= 60) return 'var(--color-cyan)';
  if (score >= 40) return '#f59e0b';
  return 'var(--color-rose)';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Work';
}

interface Props {
  summary: AccountSummary;
  positions: Position[];
}

export default function HealthScore({ summary, positions }: Props) {
  const { total, breakdown } = useMemo(
    () => calculateHealth(summary, positions),
    [summary, positions],
  );

  const color = getScoreColor(total);
  const label = getScoreLabel(total);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (total / 100) * circumference;

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="mb-4 font-heading text-lg font-semibold">
        Portfolio Health
      </h2>

      <div className="flex items-center gap-8">
        <div className="relative h-36 w-36 shrink-0">
          <svg
            viewBox="0 0 120 120"
            className="h-full w-full -rotate-90"
          >
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 8px ${color})`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-heading text-3xl font-bold"
              style={{ color }}
            >
              {total}
            </span>
            <span className="text-xs text-text-muted">{label}</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {breakdown.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-text-secondary">
                  {item.label}
                </span>
                <span className="text-xs text-text-muted">
                  {item.detail} ({item.score}/{item.maxScore})
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-bg-card">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(item.score / item.maxScore) * 100}%`,
                    backgroundColor: getScoreColor(
                      (item.score / item.maxScore) * 100,
                    ),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
