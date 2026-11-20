'use client';

import type { ReactNode } from 'react';

export type CredentialState = 'set' | 'unset' | 'partial';

const STATE_STYLES: Record<CredentialState, string> = {
  set: 'bg-emerald/10 text-emerald ring-emerald/25',
  partial: 'bg-amber-500/10 text-amber-400 ring-amber-500/25',
  unset: 'bg-bg-card text-text-muted ring-border',
};

const STATE_LABEL: Record<CredentialState, string> = {
  set: 'Set',
  partial: 'Incomplete',
  unset: 'Not set',
};

export function StatusChip({ state }: { state: CredentialState }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-caption font-semibold ring-1 ${STATE_STYLES[state]}`}
    >
      {STATE_LABEL[state]}
    </span>
  );
}

/**
 * One line per credential, so the whole configuration can be read at a glance
 * before scrolling into the forms.
 */
export function StatusRow({
  label,
  state,
  detail,
  action,
}: {
  label: string;
  state: CredentialState;
  detail?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border py-2.5 last:border-b-0">
      <StatusChip state={state} />
      <span className="text-body font-medium">{label}</span>
      {detail && (
        <span className="min-w-0 flex-1 truncate font-mono text-caption text-text-muted">
          {detail}
        </span>
      )}
      {action && <span className="ml-auto shrink-0">{action}</span>}
    </div>
  );
}
