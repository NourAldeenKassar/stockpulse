'use client';

import { Card, SectionHeading } from '@/components/ui';

export default function StockPeers({ peers }: { peers: string[] }) {
  if (peers.length === 0) return null;

  return (
    <Card tone="quiet">
      <SectionHeading>Peers</SectionHeading>
      <div className="flex flex-wrap gap-2">
        {peers.map((p) => (
          <span
            key={p}
            className="rounded-lg border border-border bg-bg-card px-3 py-1.5 font-mono text-caption text-text-secondary"
          >
            {p}
          </span>
        ))}
      </div>
      <p className="mt-4 text-caption text-text-muted">
        Companies Finnhub considers comparable. Not holdings.
      </p>
    </Card>
  );
}
