import { Leaf, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACCESS_TYPE_LABELS } from '@/lib/constants';
import type { AccessType } from '@prisma/client';

interface AccessTagProps {
  accessType: AccessType | null;
  /** `dark` renders for use over photos (white on translucent). */
  variant?: 'light' | 'dark';
  className?: string;
}

/**
 * Access pill — leaf icon when free ("Libre"), shield otherwise.
 * Light: green when free else neutral. Dark: white over a translucent fill.
 */
export function AccessTag({ accessType, variant = 'light', className }: AccessTagProps) {
  const effective = (accessType ?? 'FREE') as AccessType;
  const isFree = effective === 'FREE';
  const label = ACCESS_TYPE_LABELS[effective] ?? effective;
  const Icon = isFree ? Leaf : Shield;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        variant === 'dark'
          ? 'bg-white/[0.16] text-white backdrop-blur-sm'
          : isFree
            ? 'bg-[rgba(31,157,107,0.12)] text-[#1f9d6b]'
            : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
      {label}
    </span>
  );
}
