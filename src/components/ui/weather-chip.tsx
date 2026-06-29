import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherChipProps {
  icon: LucideIcon;
  label: string;
  className?: string;
}

/** Small weather/conditions chip — teal icon + muted label. */
export function WeatherChip({ icon: Icon, label, className }: WeatherChipProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[13px] font-semibold text-fs-muted', className)}>
      <Icon className="h-4 w-4 text-fs-accent" strokeWidth={1.9} />
      {label}
    </span>
  );
}
