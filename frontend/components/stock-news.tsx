'use client';

import type { NewsItem } from '@/lib/types';
import { Card, LocalTime, SectionHeading } from '@/components/ui';

export default function StockNews({ news }: { news: NewsItem[] }) {
  if (news.length === 0) return null;

  return (
    <Card>
      <SectionHeading
        action={
          <span className="text-caption text-text-muted">last 30 days</span>
        }
      >
        Recent news
      </SectionHeading>

      <div className="space-y-3">
        {news.map((item) => (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-lg border border-border px-4 py-3 transition-colors hover:border-border-glow hover:bg-bg-card-hover"
          >
            <p className="text-body font-medium transition-colors group-hover:text-cyan">
              {item.headline}
            </p>
            <p className="mt-1 text-caption text-text-muted">
              {item.source}
              {item.source ? ' · ' : ''}
              <LocalTime iso={item.datetime} mode="date" />
            </p>
          </a>
        ))}
      </div>
    </Card>
  );
}
