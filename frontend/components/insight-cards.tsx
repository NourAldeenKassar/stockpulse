'use client';

import { useState, useEffect } from 'react';
import type { Insight } from '@/lib/api';
import * as api from '@/lib/api';
import type { LlmSettings } from '@/lib/api';

const typeIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  warning: {
    icon: (
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
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    color: 'rose',
  },
  info: {
    icon: (
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
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    color: 'cyan',
  },
  suggestion: {
    icon: (
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
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    color: 'emerald',
  },
};

const severityBadge: Record<string, string> = {
  low: 'bg-cyan/10 text-cyan',
  medium: 'bg-amber-500/10 text-amber-400',
  high: 'bg-rose/10 text-rose',
};

interface Props {
  accountId: string;
  llmSettings: LlmSettings | null;
  initialInsights?: Insight[];
}

export default function InsightCards({ accountId, llmSettings, initialInsights }: Props) {
  const [insights, setInsights] = useState<Insight[]>(initialInsights || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(!!initialInsights?.length);

  const configured = llmSettings?.hasLlmKey && llmSettings?.llmGatewayUrl;

  useEffect(() => {
    if (initialInsights?.length) return;
    if (accountId && accountId !== 'demo') {
      api
        .getInsights(accountId)
        .then((cached) => {
          if (cached && cached.length > 0) {
            setInsights(cached);
            setGenerated(true);
          }
        })
        .catch(() => {});
    }
  }, [accountId, initialInsights]);

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const result = await api.generateInsights(accountId);
      setInsights(result);
      setGenerated(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  }

  if (!configured) {
    return (
      <div className="glass-card rounded-xl p-6">
        <h2 className="mb-2 font-heading text-lg font-semibold">
          AI Insights
        </h2>
        <p className="text-sm text-text-muted">
          Configure your LLM Gateway in{' '}
          <a href="/settings" className="text-cyan hover:text-cyan-dim">
            Settings
          </a>{' '}
          to enable AI-powered portfolio insights.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">AI Insights</h2>
        <button
          onClick={() => void handleGenerate()}
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-cyan to-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan/30 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading
            ? 'Analyzing...'
            : generated
              ? 'Regenerate'
              : 'Generate Insights'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose/20 bg-rose-glow px-4 py-3 text-sm text-rose">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
          <span className="text-sm text-text-muted">
            AI is analyzing your portfolio...
          </span>
        </div>
      )}

      {!loading && insights.length === 0 && !generated && (
        <p className="text-sm text-text-muted">
          Click "Generate Insights" to get AI analysis of your portfolio.
        </p>
      )}

      {!loading && insights.length === 0 && generated && (
        <p className="text-sm text-text-muted">
          No insights generated. Try again.
        </p>
      )}

      {!loading && insights.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((insight, i) => {
            const meta = typeIcons[insight.type] || typeIcons.info;
            return (
              <div
                key={i}
                className="rounded-lg border border-border bg-bg-card p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {meta.icon}
                    <span className="text-sm font-semibold">
                      {insight.title}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${severityBadge[insight.severity] || severityBadge.low}`}
                  >
                    {insight.severity}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {insight.body}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
