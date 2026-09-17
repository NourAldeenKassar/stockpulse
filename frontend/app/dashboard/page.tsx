'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import * as api from '@/lib/api';
import type {
  TradingAccount,
  AccountSummary,
  Position,
  Snapshot,
} from '@/lib/types';
import type { LlmSettings } from '@/lib/api';
import SortableSection from '@/components/sortable-section';
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
const STORAGE_KEY = 'dashboard-section-order';

const DEFAULT_ORDER = [
  'summary',
  'stats',
  'health-insights',
  'heatmap',
  'chart',
  'allocation-row',
  'simulator',
  'positions',
];

function loadOrder(): string[] {
  if (typeof window === 'undefined') return DEFAULT_ORDER;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      const valid = parsed.filter((id) => DEFAULT_ORDER.includes(id));
      const missing = DEFAULT_ORDER.filter((id) => !valid.includes(id));
      return [...valid, ...missing];
    }
  } catch {}
  return DEFAULT_ORDER;
}

function saveOrder(order: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}

export default function DashboardPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [llmSettings, setLlmSettings] = useState<LlmSettings | null>(null);
  const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_ORDER);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    setSectionOrder(loadOrder());
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSectionOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        const newOrder = arrayMove(prev, oldIndex, newIndex);
        saveOrder(newOrder);
        return newOrder;
      });
    }
  }

  function handleReset() {
    setSectionOrder(DEFAULT_ORDER);
    saveOrder(DEFAULT_ORDER);
  }

  useEffect(() => {
    api.getLlmSettings().then(setLlmSettings).catch(() => {});
    api
      .listAccounts()
      .then((accs) => {
        setAccounts(accs);
        if (accs.length > 0) {
          setSelectedAccount(accs[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const loadData = useCallback(async (accountId: string) => {
    setLoading(true);
    setError('');
    try {
      const [s, p, snaps] = await Promise.all([
        api.getAccountSummary(accountId),
        api.getAccountPositions(accountId),
        api.getSnapshots(accountId),
      ]);
      setSummary(s);
      setPositions(p);
      setSnapshots(snaps);
    } catch (err: any) {
      setError(err.message || 'Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      void loadData(selectedAccount);
    }
  }, [selectedAccount, loadData]);

  const sectionMap: Record<string, React.ReactNode> = useMemo(
    () => ({
      summary: summary ? <PortfolioSummary summary={summary} /> : null,
      stats:
        summary && positions.length > 0 ? (
          <StatsRibbon summary={summary} positions={positions} />
        ) : null,
      'health-insights':
        summary && positions.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <HealthScore summary={summary} positions={positions} />
            <InsightCards
              accountId={selectedAccount}
              llmSettings={llmSettings}
            />
          </div>
        ) : null,
      heatmap:
        positions.length > 0 ? (
          <PositionHeatmap positions={positions} />
        ) : null,
      chart: <PortfolioChart snapshots={snapshots} />,
      'allocation-row':
        positions.length > 0 ? (
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
      simulator:
        positions.length > 0 ? (
          <WhatIfSimulator positions={positions} />
        ) : null,
      positions:
        positions.length > 0 ? (
          <PositionsTable positions={positions} />
        ) : null,
    }),
    [summary, positions, snapshots, selectedAccount, llmSettings],
  );

  const SECTION_LABELS: Record<string, string> = {
    summary: 'Summary Cards',
    stats: 'Stats Ribbon',
    'health-insights': 'Health + Insights',
    heatmap: 'Heatmap',
    chart: 'Portfolio Chart',
    'allocation-row': 'Allocation / Currency / Movers',
    simulator: 'What-If Simulator',
    positions: 'Positions Table',
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
          <p className="text-sm text-text-muted">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="glass-card glow-cyan max-w-md rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan/10">
            <svg
              width="28"
              height="28"
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
          </div>
          <h2 className="mb-2 font-heading text-xl font-bold">
            Connect Your Portfolio
          </h2>
          <p className="mb-6 text-sm text-text-secondary">
            Connect your Trading212 account to start tracking your portfolio
            performance.
          </p>
          <button
            onClick={() => router.push('/settings')}
            className="rounded-lg bg-gradient-to-r from-cyan to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan/30"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {accounts.length > 1 && (
            <>
              <label className="text-sm font-medium text-text-secondary">
                Account:
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.label}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editMode && (
            <button
              onClick={handleReset}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text-secondary"
            >
              Reset Order
            </button>
          )}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              editMode
                ? 'bg-cyan/15 text-cyan ring-1 ring-cyan/30'
                : 'bg-bg-card text-text-secondary hover:text-text-primary'
            }`}
          >
            {editMode ? 'Done' : 'Customize Layout'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose/20 bg-rose-glow px-4 py-3 text-sm text-rose">
          {error}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sectionOrder}
          strategy={verticalListSortingStrategy}
        >
          <div className={`space-y-6 ${editMode ? 'pl-10' : ''}`}>
            {sectionOrder.map((sectionId) => {
              const content = sectionMap[sectionId];
              if (!content) return null;
              return (
                <SortableSection
                  key={sectionId}
                  id={sectionId}
                  editMode={editMode}
                >
                  {editMode && (
                    <div className="pointer-events-none absolute -top-2 left-3 z-10 rounded bg-cyan/20 px-2 py-0.5 text-[10px] font-semibold text-cyan">
                      {SECTION_LABELS[sectionId] || sectionId}
                    </div>
                  )}
                  {content}
                </SortableSection>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
