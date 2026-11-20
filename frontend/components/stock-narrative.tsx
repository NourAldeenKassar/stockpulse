'use client';

import type { StockNarrative } from '@/lib/types';
import { LocalTime } from '@/components/ui';

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-caption font-medium uppercase tracking-wider text-text-muted">
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2 text-body leading-relaxed text-text-secondary"
          >
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-violet" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Deliberately styled differently from the data cards. The analyst panel is
 * measured fact; this is a model's opinion, and a reader should be able to see
 * which is which without reading the label.
 */
export default function StockNarrativePanel({
  narrative,
  provider,
  model,
  generatedAt,
}: {
  narrative: StockNarrative;
  provider: string | null;
  model: string | null;
  generatedAt: string | null;
}) {
  return (
    <div className="rounded-xl border border-violet/25 bg-violet/[0.04] p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-violet)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1m0-12.8l-2.1 2.1M7.7 16.3l-2.1 2.1" />
          </svg>
          <h2 className="font-heading text-heading font-semibold">
            AI analysis
          </h2>
        </div>
        {(provider || model) && (
          <span className="font-mono text-caption text-text-muted">
            {provider}
            {model ? ` · ${model}` : ''}
          </span>
        )}
      </div>

      <p className="mb-5 text-body leading-relaxed text-text-primary">
        {narrative.summary}
      </p>

      <div className="mb-5 space-y-4">
        <div>
          <p className="mb-1.5 text-caption font-medium uppercase tracking-wider text-text-muted">
            Reading the consensus
          </p>
          <p className="text-body leading-relaxed text-text-secondary">
            {narrative.consensusReading}
          </p>
        </div>
        {narrative.fundamentalsReading ? (
          <div>
            <p className="mb-1.5 text-caption font-medium uppercase tracking-wider text-text-muted">
              Reading the fundamentals
            </p>
            <p className="text-body leading-relaxed text-text-secondary">
              {narrative.fundamentalsReading}
            </p>
          </div>
        ) : null}
        {narrative.newsReading ? (
          <div>
            <p className="mb-1.5 text-caption font-medium uppercase tracking-wider text-text-muted">
              Reading the news
            </p>
            <p className="text-body leading-relaxed text-text-secondary">
              {narrative.newsReading}
            </p>
          </div>
        ) : null}
        <div>
          <p className="mb-1.5 text-caption font-medium uppercase tracking-wider text-text-muted">
            Your position
          </p>
          <p className="text-body leading-relaxed text-text-secondary">
            {narrative.positionNotes}
          </p>
        </div>
      </div>

      <div className="mb-5 grid gap-5 sm:grid-cols-2">
        <Bullets title="Risks" items={narrative.risks} />
        <Bullets title="Considerations" items={narrative.considerations} />
      </div>

      <p className="border-t border-violet/15 pt-3 text-caption text-text-muted">
        AI-generated interpretation, not financial advice. It can be wrong.
        {generatedAt ? (
          <>
            {' '}
            Generated <LocalTime iso={generatedAt} />.
          </>
        ) : null}
      </p>
    </div>
  );
}
