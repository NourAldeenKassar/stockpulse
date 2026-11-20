import type { Position } from './types';

/** Unrealized gain or loss on a position, as a percentage of what was paid. */
export function pplPercent(position: Position): number {
  if (position.averagePricePaid <= 0) return 0;
  return (
    ((position.currentPrice - position.averagePricePaid) /
      position.averagePricePaid) *
    100
  );
}

/** A position's share of the portfolio, as a percentage. */
export function allocationPercent(position: Position, total: number): number {
  if (total <= 0) return 0;
  return (position.walletImpact.currentValue / total) * 100;
}

export function totalMarketValue(positions: Position[]): number {
  return positions.reduce((sum, p) => sum + p.walletImpact.currentValue, 0);
}

/** Whole days since the position was opened, relative to the given instant. */
export function holdingDays(position: Position, now: number): number {
  const opened = new Date(position.createdAt).getTime();
  return Math.floor((now - opened) / (1000 * 60 * 60 * 24));
}

export function averageHoldingDays(positions: Position[], now: number): number {
  if (positions.length === 0) return 0;
  const total = positions.reduce((sum, p) => sum + holdingDays(p, now), 0);
  return Math.round(total / positions.length);
}
