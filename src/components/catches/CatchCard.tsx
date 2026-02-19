import Image from 'next/image';
import Link from 'next/link';
import { Fish, MapPin, Calendar, Ruler, Weight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import type { CatchData } from '@/types/catch';

interface CatchCardProps {
  catchData: CatchData;
}

export function CatchCard({ catchData }: CatchCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex gap-4 p-4">
        {catchData.imageUrl && (
          <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
            <Image src={catchData.imageUrl} alt={catchData.species.name} fill className="object-cover" sizes="96px" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Fish className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{catchData.species.name}</span>
            {catchData.isReleased && <Badge variant="success" className="text-[10px]">Relâché</Badge>}
          </div>

          <Link href={`/spots/${catchData.spot.slug}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-1">
            <MapPin className="h-3 w-3" /> {catchData.spot.name}
          </Link>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {catchData.length && (
              <span className="flex items-center gap-0.5"><Ruler className="h-3 w-3" /> {catchData.length} cm</span>
            )}
            {catchData.weight && (
              <span className="flex items-center gap-0.5"><Weight className="h-3 w-3" /> {(catchData.weight / 1000).toFixed(1)} kg</span>
            )}
            <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" /> {formatRelativeTime(catchData.caughtAt)}</span>
          </div>

          {catchData.technique && (
            <p className="text-xs text-muted-foreground mt-1">Technique : {catchData.technique}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
