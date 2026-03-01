import { Badge } from '@/components/ui/badge';
import { ACCESS_TYPE_LABELS } from '@/lib/constants';
import type { AccessType } from '@prisma/client';

const ACCESS_COLORS: Record<string, string> = {
  FREE: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  FISHING_CARD: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  AAPPMA_SPECIFIC: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
  PAID: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  MEMBERS_ONLY: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  RESTRICTED: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  PRIVATE: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
};

interface SpotAccessBadgeProps {
  accessType: AccessType | null;
  size?: 'sm' | 'default';
}

export function SpotAccessBadge({ accessType, size = 'default' }: SpotAccessBadgeProps) {
  const effective = accessType || 'FREE';
  const label = ACCESS_TYPE_LABELS[effective] || effective;
  const colorClass = ACCESS_COLORS[effective] || '';

  return (
    <Badge
      variant="outline"
      className={`${colorClass} ${size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs'}`}
    >
      {label}
    </Badge>
  );
}
