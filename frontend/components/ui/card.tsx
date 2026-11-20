import type { ReactNode } from 'react';
import { cn } from './cn';

type Padding = 'none' | 'sm' | 'md' | 'lg';
type Tone = 'prominent' | 'default' | 'quiet';

const PADDING: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

const TONE: Record<Tone, string> = {
  prominent: 'surface-prominent rounded-2xl',
  default: 'surface rounded-xl',
  quiet: 'surface-quiet rounded-xl',
};

export default function Card({
  children,
  className,
  padding = 'md',
  tone = 'default',
  glow,
}: {
  children: ReactNode;
  className?: string;
  padding?: Padding;
  /** Importance, not content type. See the surface tiers in globals.css. */
  tone?: Tone;
  glow?: 'cyan' | 'emerald' | 'rose';
}) {
  return (
    <div
      className={cn(
        TONE[tone],
        PADDING[padding],
        glow && `glow-${glow}`,
        className,
      )}
    >
      {children}
    </div>
  );
}
