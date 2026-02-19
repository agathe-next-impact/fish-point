'use client';

import { Marker, Popup } from 'react-map-gl';
import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Star, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WATER_TYPE_LABELS } from '@/lib/constants';
import { formatDistance } from '@/lib/mapbox';
import type { SpotListItem } from '@/types/spot';

interface SpotMarkerProps {
  spot: SpotListItem;
  onClick?: (spot: SpotListItem) => void;
}

export function SpotMarker({ spot, onClick }: SpotMarkerProps) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      <Marker
        latitude={spot.latitude}
        longitude={spot.longitude}
        anchor="bottom"
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          setShowPopup(true);
          onClick?.(spot);
        }}
      >
        <div className="cursor-pointer group">
          <MapPin
            className={`h-8 w-8 transition-transform group-hover:scale-110 ${
              spot.isVerified ? 'text-primary' : 'text-muted-foreground'
            }`}
            fill="currentColor"
          />
        </div>
      </Marker>

      {showPopup && (
        <Popup
          latitude={spot.latitude}
          longitude={spot.longitude}
          anchor="bottom"
          offset={30}
          closeOnClick={false}
          onClose={() => setShowPopup(false)}
          className="spot-popup"
        >
          <div className="p-2 min-w-[200px]">
            <h3 className="font-semibold text-sm mb-1">{spot.name}</h3>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {WATER_TYPE_LABELS[spot.waterType] || spot.waterType}
              </Badge>
              {spot.averageRating > 0 && (
                <span className="flex items-center gap-0.5 text-xs">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  {spot.averageRating.toFixed(1)}
                </span>
              )}
            </div>
            {spot.distance !== undefined && (
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                {formatDistance(spot.distance)}
              </p>
            )}
            <Link href={`/spots/${spot.slug}`}>
              <Button size="sm" className="w-full text-xs">
                Voir détail
              </Button>
            </Link>
          </div>
        </Popup>
      )}
    </>
  );
}
