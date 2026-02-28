'use client';

import Link from 'next/link';
import { MapPin, Star, Anchor, Flag, Fish, Lock, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PrivateSpotCardData {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  tags: string[];
  visitCount: number;
  lastVisitDate: string | null;
}

interface PrivateSpotCardProps {
  spot: PrivateSpotCardData;
}

function getIconComponent(icon: string | null) {
  switch (icon) {
    case 'star': return Star;
    case 'fish': return Fish;
    case 'anchor': return Anchor;
    case 'flag': return Flag;
    default: return MapPin;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function PrivateSpotCard({ spot }: PrivateSpotCardProps) {
  const IconComponent = getIconComponent(spot.icon);
  const color = spot.color || '#3b82f6';

  return (
    <Link href={`/my-spots/${spot.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow group">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center h-10 w-10 rounded-full shrink-0 relative"
              style={{ backgroundColor: color }}
            >
              <IconComponent className="h-5 w-5 text-white" />
              <Lock className="h-3 w-3 text-white absolute -bottom-0.5 -right-0.5 bg-gray-700 rounded-full p-0.5" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                {spot.name}
              </h3>

              {spot.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {spot.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {spot.tags.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{spot.tags.length - 4}
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {spot.visitCount} visite{spot.visitCount !== 1 ? 's' : ''}
                </span>
                {spot.lastVisitDate && (
                  <span className="text-xs">
                    Derniere : {formatDate(spot.lastVisitDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
