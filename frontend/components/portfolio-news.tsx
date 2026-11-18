'use client';

import Link from 'next/link';
import type { MarketOverview } from '@/lib/types';
import { Card, LocalTime, SectionHeading } from '@/components/ui';

export default function PortfolioNews({
  overview,
  accountId,
}: {
  overview: MarketOverview;
  accountId: string;
}) {
  if (overview.news.length === 0) return null;

  return (
    <Card>
      <SectionHeading
        action={<span className="text-xs text-text-muted">last 30 days</span>}
      >
        News across your holdings
      </SectionHeading>

      <div className="space-y-2.5">
        {overview.news.map((item) => (
          <div
            key={`${item.ticker}-${item.url}`}
            className="rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-border-glow hover:bg-bg-card-hover sm:px-4"
          >
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Link
                href={`/stocks/${encodeURIComponent(item.ticker)}?account=${accountId}`}
                className="rounded bg-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-cyan transition-colors hover:bg-cyan/20"
              >
                {item.name}
              </Link>
              <span className="text-[11px] text-text-muted">
                {item.source}
                {item.source ? ' · ' : ''}
                <LocalTime iso={item.datetime} mode="date" />
              </span>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm font-medium leading-snug transition-colors hover:text-cyan"
            >
              {item.headline}
            </a>
          </div>
        ))}
      </div>
    </Card>
  );
}
