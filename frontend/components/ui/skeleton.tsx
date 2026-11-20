import { cn } from './cn';

/** A placeholder block that keeps a section's shape while its data loads. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded bg-white/[0.06]', className)}
      aria-hidden="true"
    />
  );
}

/**
 * Sections that depend on slow upstream data render this instead of nothing.
 * Returning null made them vanish entirely and then pop in, which reads as a
 * glitch rather than as loading.
 */
export function SkeletonCard({
  title,
  rows = 3,
}: {
  title: string;
  rows?: number;
}) {
  return (
    <div className="glass-card rounded-xl p-6" aria-busy="true">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-heading font-semibold text-text-muted">
          {title}
        </h2>
        <span className="flex items-center gap-2 text-caption text-text-muted">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
          Loading
        </span>
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}

export default Skeleton;
