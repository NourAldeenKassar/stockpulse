import { cn } from './cn';

const SIZES = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
} as const;

export default function Spinner({
  size = 'md',
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'animate-spin rounded-full border-2 border-cyan border-t-transparent',
        SIZES[size],
        className,
      )}
    />
  );
}
