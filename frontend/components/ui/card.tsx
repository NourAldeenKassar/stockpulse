import type { ReactNode } from 'react';
import { cn } from './cn';

type Padding = 'none' | 'sm' | 'md';

const PADDING: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
};

export default function Card({
  children,
  className,
  padding = 'md',
  glow,
}: {
  children: ReactNode;
  className?: string;
  padding?: Padding;
  glow?: 'cyan' | 'emerald' | 'rose';
}) {
  return (
    <div
      className={cn(
        'glass-card rounded-xl',
        PADDING[padding],
        glow && `glow-${glow}`,
        className,
      )}
    >
      {children}
    </div>
  );
}
