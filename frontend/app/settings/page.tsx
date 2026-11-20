'use client';

import { useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/api';
import type { TradingAccount } from '@/lib/types';
import type { LlmSettings } from '@/lib/api';
import AccountConnectForm from '@/components/account-connect-form';
import CredentialsCard from '@/components/credentials-card';
import { Card, LocalTime, SectionHeading, Spinner } from '@/components/ui';

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
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await loadAccounts();
      if (cancelled) return;
      await loadLlmSettings();
    })();

    return () => {
      cancelled = true;
    };
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

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-display font-bold">Settings</h1>
        <p className="mt-1 text-body text-text-secondary">
          Manage your Trading212 connections and snapshot preferences.
        </p>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h2 className="mb-4 font-heading text-heading font-semibold">
          Connected Accounts
        </h2>

        {accounts.length === 0 ? (
          <p className="text-body text-text-muted">
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
                    <h3 className="font-heading text-body font-semibold">
                      {acc.label}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-caption text-text-muted">
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
                        {acc.lastSnapshotAt ? (
                          <LocalTime iso={acc.lastSnapshotAt} />
                        ) : (
                          'Never'
                        )}
                      </span>
                      <span>
                        Connected: <LocalTime iso={acc.createdAt} mode="date" />
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void handleTriggerSnapshot(acc.id)}
                      className="rounded-lg bg-cyan/10 px-3 py-1.5 text-caption font-medium text-cyan transition-colors hover:bg-cyan/20"
                    >
                      Snapshot Now
                    </button>

                    {confirmDisconnect === acc.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void handleDisconnect(acc.id)}
                          disabled={disconnecting === acc.id}
                          className="rounded-lg bg-rose/15 px-3 py-1.5 text-caption font-medium text-rose transition-colors hover:bg-rose/25"
                        >
                          {disconnecting === acc.id ? 'Removing...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmDisconnect(null)}
                          className="rounded-lg px-3 py-1.5 text-caption font-medium text-text-muted hover:text-text-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDisconnect(acc.id)}
                        className="rounded-lg px-3 py-1.5 text-caption font-medium text-rose/60 transition-colors hover:bg-rose-glow hover:text-rose"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <label className="text-body text-text-secondary">
                    Snapshot interval:
                  </label>
                  <select
                    value={acc.snapshotIntervalMin}
                    onChange={(e) =>
                      void handleIntervalChange(acc.id, Number(e.target.value))
                    }
                    className="rounded-lg px-3 py-2 text-body"
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

      <Card>
        <SectionHeading>Add account</SectionHeading>
        <AccountConnectForm onConnected={loadAccounts} />
      </Card>

      <CredentialsCard settings={llmSettings} onSaved={setLlmSettings} />
    </div>
  );
}
