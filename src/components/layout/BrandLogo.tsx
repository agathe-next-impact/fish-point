import Link from 'next/link';
import { Fish } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  /** Hide the wordmark (icon-only). */
  iconOnly?: boolean;
  /** Render plain (no link) — e.g. inside the footer. */
  asLink?: boolean;
  className?: string;
  textClassName?: string;
}

/** FishSpot brand — accent tile + fish glyph + display wordmark. */
export function BrandLogo({ iconOnly, asLink = true, className, textClassName }: BrandLogoProps) {
  const inner = (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-[10px] text-white shadow-fs-sm"
        style={{ background: 'var(--fs-accent)' }}
      >
        <Fish className="h-[18px] w-[18px]" strokeWidth={2} />
      </span>
      {!iconOnly && (
        <span className={cn('fs-dsp text-xl font-extrabold text-ink', textClassName)}>FishSpot</span>
      )}
    </span>
  );

  if (!asLink) return inner;

  return (
    <Link href="/" className="inline-flex">
      {inner}
    </Link>
  );
}
