'use client';

import { useState } from 'react';
import * as api from '@/lib/api';

interface Props {
  onConnected: () => void;
}

export default function AccountConnectForm({ onConnected }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.connectAccount(apiKey, apiSecret, label || undefined);
      setApiKey('');
      setApiSecret('');
      setLabel('');
      onConnected();
    } catch (err: any) {
      setError(err.message || 'Failed to connect account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-rose-glow border border-rose/20 px-4 py-3 text-sm text-rose">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          API Key ID
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
          className="w-full rounded-lg px-4 py-3 text-sm font-mono"
          placeholder="Your Trading212 API Key ID"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          API Secret Key
        </label>
        <input
          type="password"
          value={apiSecret}
          onChange={(e) => setApiSecret(e.target.value)}
          required
          className="w-full rounded-lg px-4 py-3 text-sm font-mono"
          placeholder="Your Trading212 API Secret Key"
        />
        <p className="mt-1 text-xs text-text-muted">
          Find both in Trading212 &rarr; Settings &rarr; API (Key ID + Secret
          Key)
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Label (optional)
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full rounded-lg px-4 py-3 text-sm"
          placeholder="e.g. Main Portfolio"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !apiKey || !apiSecret}
        className="w-full rounded-lg bg-gradient-to-r from-cyan to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan/30 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {loading ? 'Connecting...' : 'Connect Account'}
      </button>
    </form>
  );
}
