'use client';

import type { ReactNode } from 'react';
import type {
  AccountSummary,
  LlmSettings,
  MarketOverview,
  Position,
  Snapshot,
} from '@/lib/types';
import PortfolioSummary from '@/components/portfolio-summary';
import StatsRibbon from '@/components/stats-ribbon';
import InsightCards from '@/components/insight-cards';
import HealthScore from '@/components/health-score';
import PositionHeatmap from '@/components/position-heatmap';
import PortfolioChart from '@/components/portfolio-chart';
import AllocationChart from '@/components/allocation-chart';
import CurrencyExposure from '@/components/currency-exposure';
import TopMovers from '@/components/top-movers';
import WhatIfSimulator from '@/components/what-if-simulator';
import PositionsTable from '@/components/positions-table';
import PortfolioSentiment from '@/components/portfolio-sentiment';
import PortfolioNews from '@/components/portfolio-news';
import PortfolioEarnings from '@/components/portfolio-earnings';

export interface SectionContext {
  summary: AccountSummary | null;
  positions: Position[];
  snapshots: Snapshot[];
  selectedAccount: string;
  llmSettings: LlmSettings | null;
  overview: MarketOverview | null;
  asOf: number;
}

/**
 * Maps a section id to its rendered content, or null when there is nothing to
 * show. The page only decides the order; what each section is lives here.
 */
export function buildSections(ctx: SectionContext): Record<string, ReactNode> {
  const {
    summary,
    positions,
    snapshots,
    selectedAccount,
    llmSettings,
    overview,
    asOf,
  } = ctx;
  const hasPositions = positions.length > 0;

  return {
    summary: summary ? <PortfolioSummary summary={summary} /> : null,

    stats:
      summary && hasPositions ? (
        <StatsRibbon summary={summary} positions={positions} asOf={asOf} />
      ) : null,

    'health-insights':
      summary && hasPositions ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <HealthScore summary={summary} positions={positions} />
          <InsightCards accountId={selectedAccount} llmSettings={llmSettings} />
        </div>
      ) : null,

    heatmap: hasPositions ? (
      <PositionHeatmap positions={positions} accountId={selectedAccount} />
    ) : null,

    chart: <PortfolioChart snapshots={snapshots} />,

    'allocation-row': hasPositions ? (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <AllocationChart positions={positions} />
        </div>
        <div className="lg:col-span-1">
          <CurrencyExposure positions={positions} />
        </div>
        <div className="lg:col-span-2">
          <TopMovers positions={positions} />
        </div>
      </div>
    ) : null,

    sentiment: overview ? (
      <PortfolioSentiment overview={overview} accountId={selectedAccount} />
    ) : null,

    earnings: overview ? (
      <PortfolioEarnings overview={overview} accountId={selectedAccount} />
    ) : null,

    news: overview ? (
      <PortfolioNews overview={overview} accountId={selectedAccount} />
    ) : null,

    simulator: hasPositions ? <WhatIfSimulator positions={positions} /> : null,

    positions: hasPositions ? (
      <PositionsTable positions={positions} accountId={selectedAccount} />
    ) : null,
  };
}
