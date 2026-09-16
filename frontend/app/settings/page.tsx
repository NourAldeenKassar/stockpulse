'use client';

import { useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/api';
import type { TradingAccount } from '@/lib/types';
import type { LlmSettings } from '@/lib/api';
import AccountConnectForm from '@/components/account-connect-form';

const INTERVAL_OPTIONS = [
  { value: 60, label: 'Every hour' },
  { value: 240, label: 'Every 4 hours' },
  { value: 480, label: 'Every 8 hours' },
  { value: 720, label: 'Every 12 hours' },
  { value: 1440, label: 'Daily (default)' },
];

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(
    null,
  );
  const [llmSettings, setLlmSettings] = useState<LlmSettings | null>(null);
  const [llmUrl, setLlmUrl] = useState('');
  const [llmKey, setLlmKey] = useState('');
  const [llmSaving, setLlmSaving] = useState(false);
  const [llmSuccess, setLlmSuccess] = useState(false);

  const loadAccounts = useCallback(async () => {
    try {
      const accs = await api.listAccounts();
      setAccounts(accs);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLlmSettings = useCallback(async () => {
    try {
      const settings = await api.getLlmSettings();
      setLlmSettings(settings);
      setLlmUrl(settings.llmGatewayUrl);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
    void loadLlmSettings();
  }, [loadAccounts, loadLlmSettings]);

  async function handleDisconnect(id: string) {
    setDisconnecting(id);
    try {
      await api.disconnectAccount(id);
      setConfirmDisconnect(null);
      await loadAccounts();
    } finally {
      setDisconnecting(null);
    }
  }

  async function handleIntervalChange(id: string, value: number) {
    await api.updateAccount(id, { snapshotIntervalMin: value });
    await loadAccounts();
  }

  async function handleTriggerSnapshot(id: string) {
    await api.triggerSnapshot(id);
    await loadAccounts();
  }

  async function handleSaveLlm(e: React.FormEvent) {
    e.preventDefault();
    setLlmSaving(true);
    setLlmSuccess(false);
    try {
      const data: { llmGatewayUrl?: string; llmGatewayKey?: string } = {
        llmGatewayUrl: llmUrl,
      };
      if (llmKey) data.llmGatewayKey = llmKey;
      const updated = await api.updateLlmSettings(data);
      setLlmSettings(updated);
      setLlmKey('');
      setLlmSuccess(true);
      setTimeout(() => setLlmSuccess(false), 3000);
    } finally {
      setLlmSaving(false);
    }
  }

  async function handleDisableLlm() {
    setLlmSaving(true);
    try {
      const updated = await api.updateLlmSettings({
        llmGatewayUrl: '',
        llmGatewayKey: '',
      });
      setLlmSettings(updated);
      setLlmUrl('');
      setLlmKey('');
    } finally {
      setLlmSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your Trading212 connections and snapshot preferences.
        </p>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Connected Accounts
        </h2>

        {accounts.length === 0 ? (
          <p className="text-sm text-text-muted">
            No accounts connected yet. Add one below.
          </p>
        ) : (
          <div className="space-y-4">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="rounded-xl border border-border bg-bg-card p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-base font-semibold">
                      {acc.label}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-text-muted">
                      <span>
                        Status:{' '}
                        <span
                          className={acc.active ? 'text-emerald' : 'text-rose'}
                        >
                          {acc.active ? 'Active' : 'Inactive'}
                        </span>
                      </span>
                      <span>
                        Last snapshot:{' '}
                        {acc.lastSnapshotAt
                          ? new Date(acc.lastSnapshotAt).toLocaleString()
                          : 'Never'}
                      </span>
                      <span>
                        Connected:{' '}
                        {new Date(acc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void handleTriggerSnapshot(acc.id)}
                      className="rounded-lg bg-cyan/10 px-3 py-1.5 text-xs font-medium text-cyan transition-colors hover:bg-cyan/20"
                    >
                      Snapshot Now
                    </button>

                    {confirmDisconnect === acc.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void handleDisconnect(acc.id)}
                          disabled={disconnecting === acc.id}
                          className="rounded-lg bg-rose/15 px-3 py-1.5 text-xs font-medium text-rose transition-colors hover:bg-rose/25"
                        >
                          {disconnecting === acc.id ? 'Removing...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmDisconnect(null)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDisconnect(acc.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose/60 transition-colors hover:bg-rose-glow hover:text-rose"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <label className="text-sm text-text-secondary">
                    Snapshot interval:
                  </label>
                  <select
                    value={acc.snapshotIntervalMin}
                    onChange={(e) =>
                      void handleIntervalChange(acc.id, Number(e.target.value))
                    }
                    className="rounded-lg px-3 py-2 text-sm"
                  >
                    {INTERVAL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="mb-4 font-heading text-lg font-semibold">Add Account</h2>
        <AccountConnectForm onConnected={loadAccounts} />
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold">AI Insights</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Connect your LLM Gateway to enable AI-powered portfolio insights.
            </p>
          </div>
          {llmSettings?.hasLlmKey && (
            <span className="rounded-full bg-emerald/10 px-3 py-1 text-xs font-semibold text-emerald ring-1 ring-emerald/20">
              Enabled
            </span>
          )}
        </div>

        <form onSubmit={handleSaveLlm} className="space-y-4">
          {llmSuccess && (
            <div className="rounded-lg bg-emerald-glow border border-emerald/20 px-4 py-3 text-sm text-emerald">
              LLM Gateway settings saved
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              Gateway URL
            </label>
            <input
              type="text"
              value={llmUrl}
              onChange={(e) => setLlmUrl(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-sm font-mono"
              placeholder="e.g. http://your-gateway:3005"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              API Key{' '}
              {llmSettings?.hasLlmKey && (
                <span className="text-text-muted">(already set, leave empty to keep)</span>
              )}
            </label>
            <input
              type="password"
              value={llmKey}
              onChange={(e) => setLlmKey(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-sm font-mono"
              placeholder={
                llmSettings?.hasLlmKey ? 'Leave empty to keep current key' : 'Your LLM Gateway API key'
              }
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={llmSaving || !llmUrl}
              className="rounded-lg bg-gradient-to-r from-cyan to-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan/30 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {llmSaving ? 'Saving...' : 'Save'}
            </button>

            {llmSettings?.hasLlmKey && (
              <button
                type="button"
                onClick={() => void handleDisableLlm()}
                disabled={llmSaving}
                className="rounded-lg px-6 py-2.5 text-sm font-medium text-rose/60 transition-colors hover:bg-rose-glow hover:text-rose"
              >
                Disable AI Insights
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
