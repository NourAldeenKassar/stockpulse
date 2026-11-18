'use client';

import { useState } from 'react';
import * as api from '@/lib/api';
import type { LlmSettings } from '@/lib/types';
import { Button, Card, SectionHeading } from '@/components/ui';
import { StatusRow } from '@/components/credential-status';
import type { CredentialState } from '@/components/credential-status';

interface Props {
  settings: LlmSettings | null;
  onSaved: (settings: LlmSettings) => void;
}

/** A URL without a key (or the reverse) is configured but unusable. */
function pairState(hasUrl: boolean, hasKey: boolean): CredentialState {
  if (hasUrl && hasKey) return 'set';
  if (hasUrl || hasKey) return 'partial';
  return 'unset';
}

/**
 * Uncontrolled on purpose. Mirroring the saved settings into state would mean
 * syncing props to state in an effect, which causes a cascading render; the
 * form is read with FormData on submit instead.
 */
function Field({
  label,
  name,
  hint,
  type = 'text',
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  hint?: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-text-secondary"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-lg px-4 py-3 font-mono text-sm"
      />
      {hint && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

export default function CredentialsCard({ settings, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  async function save(patch: Parameters<typeof api.updateLlmSettings>[0]) {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const updated = await api.updateLlmSettings(patch);
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const SECRET_FIELDS = ['llmGatewayKey', 'llmPremiumKey', 'finnhubKey'];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Captured now: currentTarget is null once the save has awaited.
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const read = (name: string) => String(form.get(name) ?? '').trim();

    const llmKey = read('llmGatewayKey');
    const premiumKey = read('llmPremiumKey');
    const finnhubKey = read('finnhubKey');

    void save({
      llmGatewayUrl: read('llmGatewayUrl'),
      llmPremiumGatewayUrl: read('llmPremiumGatewayUrl'),
      ...(llmKey ? { llmGatewayKey: llmKey } : {}),
      ...(premiumKey ? { llmPremiumKey: premiumKey } : {}),
      ...(finnhubKey ? { finnhubKey } : {}),
    }).then(() => {
      // Clear only the secrets. A full reset would restore the URL inputs to
      // their now-stale defaultValue.
      for (const name of SECRET_FIELDS) {
        const el = formEl.elements.namedItem(name);
        if (el instanceof HTMLInputElement) el.value = '';
      }
    });
  }

  const standard = pairState(
    Boolean(settings?.llmGatewayUrl),
    Boolean(settings?.hasLlmKey),
  );
  const premium = pairState(
    Boolean(settings?.llmPremiumGatewayUrl),
    Boolean(settings?.hasPremiumKey),
  );
  const finnhub: CredentialState = settings?.hasFinnhubKey ? 'set' : 'unset';

  const clearButton = (label: string, patch: Record<string, string>) => (
    <Button
      variant="ghost"
      size="sm"
      disabled={saving}
      onClick={() => void save(patch)}
      aria-label={`Clear ${label}`}
    >
      Clear
    </Button>
  );

  return (
    <Card>
      <SectionHeading
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Done' : 'Edit'}
          </Button>
        }
      >
        Connections
      </SectionHeading>

      <div className="mb-2">
        <StatusRow
          label="LLM Gateway"
          state={standard}
          detail={
            settings?.llmGatewayUrl
              ? `${settings.llmGatewayUrl}${settings.llmKeyHint ? ` · key ${settings.llmKeyHint}` : ''}`
              : 'portfolio insights'
          }
          action={
            standard !== 'unset'
              ? clearButton('LLM Gateway', {
                  llmGatewayUrl: '',
                  llmGatewayKey: '',
                })
              : undefined
          }
        />
        <StatusRow
          label="Smarter model"
          state={premium}
          detail={
            settings?.llmPremiumGatewayUrl
              ? `${settings.llmPremiumGatewayUrl}${settings.premiumKeyHint ? ` · key ${settings.premiumKeyHint}` : ''}`
              : 'falls back to the gateway above'
          }
          action={
            premium !== 'unset'
              ? clearButton('premium gateway', {
                  llmPremiumGatewayUrl: '',
                  llmPremiumKey: '',
                })
              : undefined
          }
        />
        <StatusRow
          label="Finnhub"
          state={finnhub}
          detail={
            settings?.finnhubKeyHint
              ? `key ${settings.finnhubKeyHint}`
              : 'analyst data, fundamentals, news'
          }
          action={
            finnhub !== 'unset'
              ? clearButton('Finnhub key', { finnhubKey: '' })
              : undefined
          }
        />
      </div>

      {saved && (
        <div className="mt-4 rounded-lg border border-emerald/20 bg-emerald-glow px-4 py-3 text-sm text-emerald">
          Saved
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg border border-rose/20 bg-rose-glow px-4 py-3 text-sm text-rose">
          {error}
        </div>
      )}

      {expanded && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="space-y-4 border-t border-border pt-5">
            <p className="text-sm font-semibold">LLM Gateway</p>
            <Field
              label="Gateway URL"
              name="llmGatewayUrl"
              defaultValue={settings?.llmGatewayUrl ?? ''}
              placeholder="http://localhost:3000"
            />
            <Field
              label="API key"
              name="llmGatewayKey"
              type="password"
              placeholder={
                settings?.hasLlmKey
                  ? 'Leave empty to keep the current key'
                  : 'Your gateway API key'
              }
              hint="Used for portfolio insights on free providers."
            />
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <p className="text-sm font-semibold">Smarter model (per-stock)</p>
            <Field
              label="Premium gateway URL"
              name="llmPremiumGatewayUrl"
              defaultValue={settings?.llmPremiumGatewayUrl ?? ''}
              placeholder="Leave empty to reuse the gateway above"
            />
            <Field
              label="Premium API key"
              name="llmPremiumKey"
              type="password"
              placeholder={
                settings?.hasPremiumKey
                  ? 'Leave empty to keep the current key'
                  : 'Key for paid providers'
              }
              hint="Only per-stock analysis uses paid providers. Giving it its own key keeps that spend separate and revocable."
            />
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <p className="text-sm font-semibold">Finnhub</p>
            <Field
              label="Finnhub API key"
              name="finnhubKey"
              type="password"
              placeholder={
                settings?.hasFinnhubKey
                  ? 'Leave empty to keep the current key'
                  : 'Your Finnhub API key'
              }
              hint="Free tier. Supplies analyst ratings, fundamentals, earnings and news. Without it the AI works from your position data alone."
            />
          </div>

          <div className="flex flex-wrap gap-3 border-t border-border pt-5">
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
