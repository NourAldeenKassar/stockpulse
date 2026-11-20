import type { ReactNode } from 'react';
import { cn } from './cn';

type Tone = 'cyan' | 'emerald' | 'rose' | 'amber' | 'violet' | 'neutral';

const TONES: Record<Tone, string> = {
  cyan: 'bg-cyan/10 text-cyan',
  emerald: 'bg-emerald/10 text-emerald',
  rose: 'bg-rose/10 text-rose',
  amber: 'bg-amber-500/10 text-amber-400',
  violet: 'bg-violet/10 text-violet',
  neutral: 'bg-bg-card text-text-muted',
};

export default function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-caption font-semibold',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
