import Image from 'next/image';
import Link from 'next/link';
import { Fish, MapPin, Ruler, Weight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import type { CatchData } from '@/types/catch';

interface CatchCardProps {
  catchData: CatchData;
}

export function CatchCard({ catchData }: CatchCardProps) {
  return (
    <article className="flex gap-4 overflow-hidden rounded-fs-lg border border-line bg-card p-3 shadow-fs-sm transition-shadow hover:shadow-fs-md">
      <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-fs-md bg-muted">
        {catchData.imageUrl ? (
          <Image src={catchData.imageUrl} alt={catchData.species.name} fill className="object-cover" sizes="84px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-fs-faint">
            <Fish className="h-7 w-7" strokeWidth={1.6} />
          </div>
        )}
        <span className="absolute bottom-1 left-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          {formatRelativeTime(catchData.caughtAt)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="fs-dsp truncate text-[18px] font-bold text-ink">{catchData.species.name}</h3>
          {catchData.isReleased && <Badge variant="success" className="text-[10px]">Relâché</Badge>}
        </div>

        <Link
          href={`/spots/${catchData.spot.slug}`}
          className="mt-0.5 flex items-center gap-1 text-xs text-fs-muted hover:text-primary"
        >
          <MapPin className="h-3 w-3" strokeWidth={1.9} /> {catchData.spot.name}
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {catchData.length && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(217,138,28,0.14)] px-2.5 py-1 text-xs font-semibold text-amber-deep">
              <Ruler className="h-3.5 w-3.5" strokeWidth={1.9} /> {catchData.length} cm
            </span>
          )}
          {catchData.weight && (
            <span className="inline-flex items-center gap-1 rounded-full bg-aqua-soft px-2.5 py-1 text-xs font-semibold text-teal-deep">
              <Weight className="h-3.5 w-3.5" strokeWidth={1.9} /> {(catchData.weight / 1000).toFixed(1)} kg
            </span>
          )}
          {catchData.technique && (
            <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-fs-muted shadow-[inset_0_0_0_1.5px_var(--fs-line)]">
              {catchData.technique}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
