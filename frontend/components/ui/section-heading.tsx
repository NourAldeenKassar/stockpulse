import type { ReactNode } from 'react';
import { cn } from './cn';

export default function SectionHeading({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)}>
      <h2 className="font-heading text-heading font-semibold">{children}</h2>
      {action}
    </div>
  );
}
