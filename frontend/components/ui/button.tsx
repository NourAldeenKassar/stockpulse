import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'subtle' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-cyan to-blue-500 text-white shadow-lg shadow-cyan/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan/30 disabled:hover:translate-y-0',
  subtle: 'bg-cyan/10 text-cyan hover:bg-cyan/20',
  ghost: 'text-text-muted hover:text-text-secondary',
  danger: 'text-rose/60 hover:bg-rose-glow hover:text-rose',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-caption',
  md: 'px-4 py-2 text-body',
  lg: 'px-6 py-3 text-body',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        'rounded-lg font-semibold transition-all disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
