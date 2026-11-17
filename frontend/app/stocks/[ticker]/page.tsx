'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import * as api from '@/lib/api';
import type { Position, StockAnalysis } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { pplPercent, allocationPercent, totalMarketValue } from '@/lib/metrics';
import { Blur } from '@/lib/privacy';
import {
  Button,
  Card,
  LocalTime,
  SectionHeading,
  Spinner,
} from '@/components/ui';
import AnalystConsensusPanel from '@/components/analyst-consensus';
import StockNarrativePanel from '@/components/stock-narrative';

function Stat({
  label,
  value,
  tone,
  sensitive,
}: {
  label: string;
  value: string;
  tone?: string;
  sensitive?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-text-muted">{label}</p>
      <p className={`font-heading text-lg font-semibold ${tone ?? ''}`}>
        {sensitive ? <Blur>{value}</Blur> : value}
      </p>
    </div>
  );
}

export default function StockPage() {
  const params = useParams<{ ticker: string }>();
  const search = useSearchParams();
  const ticker = decodeURIComponent(params.ticker);
  const accountFromUrl = search.get('account');

  const [accountId, setAccountId] = useState(accountFromUrl ?? '');
  const [position, setPosition] = useState<Position | null>(null);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [result, setResult] = useState<StockAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        let id = accountFromUrl;
        if (!id) {
          const accounts = await api.listAccounts();
          id = accounts[0]?.id ?? '';
        }
        if (cancelled || !id) {
          if (!cancelled) setLoading(false);
          return;
        }
        setAccountId(id);

        const [positions, cached] = await Promise.all([
          api.getAccountPositions(id),
          api.getStockAnalysis(id, ticker).catch(() => null),
        ]);
        if (cancelled) return;

        setPosition(
          positions.find((p) => p.instrument.ticker === ticker) ?? null,
        );
        setPortfolioValue(totalMarketValue(positions));
        if (cached) setResult(cached);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ticker, accountFromUrl]);

  const generate = useCallback(async () => {
    if (!accountId) return;
    setGenerating(true);
    setError('');
    try {
      setResult(await api.generateStockAnalysis(accountId, ticker));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  }, [accountId, ticker]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!position) {
    return (
      <Card className="text-center">
        <p className="mb-4 text-sm text-text-secondary">
          No open position found for {ticker}.
        </p>
        <Link href="/dashboard" className="text-sm text-cyan hover:underline">
          Back to dashboard
        </Link>
      </Card>
    );
  }

  const w = position.walletImpact;
  const pct = pplPercent(position);
  const gain = w.unrealizedProfitLoss >= 0;
  const tone = gain ? 'text-emerald' : 'text-rose';

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-xs text-text-muted transition-colors hover:text-text-secondary"
        >
          ← Back to dashboard
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h1 className="font-heading text-2xl font-bold">
            {position.instrument.name}
          </h1>
          <span className="font-mono text-sm text-text-muted">
            {position.instrument.ticker}
          </span>
        </div>
      </div>

      <Card>
        <SectionHeading>Your position</SectionHeading>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Quantity" value={String(position.quantity)} />
          <Stat
            label="Avg price"
            value={formatCurrency(
              position.averagePricePaid,
              position.instrument.currency,
            )}
          />
          <Stat
            label="Current price"
            value={formatCurrency(
              position.currentPrice,
              position.instrument.currency,
            )}
          />
          <Stat
            label="Value"
            value={formatCurrency(w.currentValue, w.currency)}
            sensitive
          />
          <Stat
            label="Unrealised P&L"
            value={formatCurrency(w.unrealizedProfitLoss, w.currency)}
            tone={tone}
            sensitive
          />
          <Stat
            label="Portfolio weight"
            value={`${allocationPercent(position, portfolioValue).toFixed(1)}%`}
          />
        </div>
        <p className={`mt-4 text-sm font-semibold ${tone}`}>
          {formatPercent(pct)} since purchase
        </p>
      </Card>

      {result?.consensus ? (
        <AnalystConsensusPanel consensus={result.consensus} />
      ) : (
        <Card>
          <SectionHeading>Analyst consensus</SectionHeading>
          <p className="text-sm text-text-muted">
            {result
              ? 'No analyst data could be matched to this holding, so none is shown rather than guessed. Funds and ETFs generally have no analyst coverage.'
              : 'Generate an analysis to fetch analyst recommendations for this holding.'}
          </p>
        </Card>
      )}

      {error && (
        <div className="rounded-lg border border-rose/20 bg-rose-glow px-4 py-3 text-sm text-rose">
          {error}
        </div>
      )}

      {generating && (
        <Card>
          <div className="flex items-center gap-3 py-4">
            <Spinner size="sm" />
            <span className="text-sm text-text-muted">
              Analysing with the paid model...
            </span>
          </div>
        </Card>
      )}

      {!generating && result?.analysis && (
        <StockNarrativePanel
          narrative={result.analysis}
          provider={result.provider}
          model={result.model}
          generatedAt={result.generatedAt}
        />
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">
              {result ? 'Regenerate analysis' : 'Generate analysis'}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              {result?.generatedAt ? (
                <>
                  Last generated <LocalTime iso={result.generatedAt} />. This
                  calls a paid provider.
                </>
              ) : (
                'This calls a paid provider through your LLM Gateway.'
              )}
            </p>
          </div>
          <Button onClick={() => void generate()} disabled={generating}>
            {generating ? 'Analysing...' : result ? 'Regenerate' : 'Analyse'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
