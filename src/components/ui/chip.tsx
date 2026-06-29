'use client';

import { cn } from '@/lib/utils';

interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  active?: boolean;
  onClick?: () => void;
}

/** Toggleable pill chip (filters, quick filters). Accent fill when active. */
export function Chip({ active, className, children, type = 'button', ...props }: ChipProps) {
  return (
    <button type={type} className={cn('fs-chip', active && 'on', className)} aria-pressed={active} {...props}>
      {children}
    </button>
  );
}
