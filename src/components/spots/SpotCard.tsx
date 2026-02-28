import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WATER_TYPE_LABELS } from '@/lib/constants';
import { formatDistance } from '@/lib/mapbox';
import type { SpotListItem } from '@/types/spot';

function getFishabilityColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
}

interface SpotCardProps {
  spot: SpotListItem;
}

export function SpotCard({ spot }: SpotCardProps) {
  return (
    <Link href={`/spots/${spot.slug}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow group">
        <div className="relative h-48 bg-muted">
          {spot.primaryImage ? (
            <Image
              src={spot.primaryImage}
              alt={spot.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            {spot.fishabilityScore != null && (
              <div
                className="flex items-center justify-center h-7 w-7 rounded-full text-white text-[10px] font-bold shadow"
                style={{ backgroundColor: getFishabilityColor(spot.fishabilityScore) }}
              >
                {spot.fishabilityScore}
              </div>
            )}
            {spot.isVerified && (
              <Badge variant="success" className="text-[10px]">Vérifié</Badge>
            )}
            {spot.isPremium && (
              <Badge className="text-[10px] bg-yellow-500">Premium</Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-base mb-1 truncate">{spot.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <MapPin className="h-3 w-3" />
            <span className="truncate">
              {spot.commune ? `${spot.commune}, ` : ''}{spot.department}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {WATER_TYPE_LABELS[spot.waterType] || spot.waterType}
              </Badge>
              {spot.averageRating > 0 && (
                <span className="flex items-center gap-0.5 text-sm">
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                  {spot.averageRating.toFixed(1)}
                  <span className="text-muted-foreground text-xs">({spot.reviewCount})</span>
                </span>
              )}
            </div>
            {spot.distance !== undefined && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Navigation className="h-3 w-3" />
                {formatDistance(spot.distance)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
