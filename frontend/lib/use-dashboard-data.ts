'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '@/lib/api';
import type {
  AccountSummary,
  LlmSettings,
  MarketOverview,
  Position,
  Snapshot,
  TradingAccount,
} from '@/lib/types';

const REFRESH_INTERVAL_MS = 5000;

export interface DashboardData {
  accounts: TradingAccount[];
  selectedAccount: string;
  selectAccount: (id: string) => void;
  summary: AccountSummary | null;
  positions: Position[];
  snapshots: Snapshot[];
  llmSettings: LlmSettings | null;
  /** Free Finnhub data across all holdings. Null until loaded, or with no key. */
  overview: MarketOverview | null;
  overviewLoading: boolean;
  loading: boolean;
  error: string;
  /**
   * When the live data was last fetched. Anything time-relative (such as how
   * long a position has been held) derives from this rather than calling
   * Date.now() during render, which is impure and breaks memoization.
   */
  asOf: number;
}

export function useDashboardData(): DashboardData {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [llmSettings, setLlmSettings] = useState<LlmSettings | null>(null);
  // Stored with the account it belongs to, so "still loading" is derived
  // rather than tracked in a second piece of state that an effect must set.
  const [overviewFor, setOverviewFor] = useState<{
    account: string;
    data: MarketOverview | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [asOf, setAsOf] = useState(0);

  // Guards against a slow response for a previous account overwriting the
  // current one after the user switches.
  const requestId = useRef(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const settings = await api.getLlmSettings();
        if (!cancelled) setLlmSettings(settings);
      } catch {
        // LLM settings are optional; the dashboard works without them.
      }
    })();

    void (async () => {
      try {
        const accs = await api.listAccounts();
        if (cancelled) return;
        setAccounts(accs);
        if (accs.length > 0) {
          setSelectedAccount(accs[0].id);
        } else {
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadAll = useCallback(async (accountId: string, id: number) => {
    setLoading(true);
    setError('');
    try {
      const [s, p, snaps] = await Promise.all([
        api.getAccountSummary(accountId),
        api.getAccountPositions(accountId),
        api.getSnapshots(accountId),
      ]);
      if (requestId.current !== id) return;
      setSummary(s);
      setPositions(p);
      setSnapshots(snaps);
      setAsOf(Date.now());
    } catch (err) {
      if (requestId.current !== id) return;
      setError(
        err instanceof Error ? err.message : 'Failed to load portfolio data',
      );
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  }, []);

  const refreshLive = useCallback(async (accountId: string, id: number) => {
    try {
      const [s, p] = await Promise.all([
        api.getAccountSummary(accountId),
        api.getAccountPositions(accountId),
      ]);
      if (requestId.current !== id) return;
      setSummary(s);
      setPositions(p);
      setAsOf(Date.now());
    } catch {
      // Background refresh failures stay silent; the last good data remains.
    }
  }, []);

  useEffect(() => {
    if (!selectedAccount) return;
    let cancelled = false;

    void (async () => {
      try {
        const data = await api.getMarketOverview(selectedAccount);
        if (!cancelled) setOverviewFor({ account: selectedAccount, data });
      } catch {
        // The dashboard works without market data.
        if (!cancelled)
          setOverviewFor({ account: selectedAccount, data: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedAccount]);

  useEffect(() => {
    if (!selectedAccount) return;

    const id = ++requestId.current;
    void loadAll(selectedAccount, id);

    const interval = setInterval(() => {
      void refreshLive(selectedAccount, id);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [selectedAccount, loadAll, refreshLive]);

  const overviewReady = overviewFor?.account === selectedAccount;

  return {
    accounts,
    selectedAccount,
    selectAccount: setSelectedAccount,
    summary,
    positions,
    snapshots,
    llmSettings,
    overview: overviewReady ? (overviewFor?.data ?? null) : null,
    overviewLoading: Boolean(selectedAccount) && !overviewReady,
    loading,
    error,
    asOf,
  };
}
