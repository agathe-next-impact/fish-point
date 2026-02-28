'use client';

import { Marker, Popup } from 'react-map-gl/mapbox';
import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Star, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
          {spot.fishabilityScore != null ? (
            <div
              className="flex items-center justify-center h-8 w-8 rounded-full text-white text-xs font-bold shadow-md transition-transform group-hover:scale-110 border-2 border-white"
              style={{ backgroundColor: getFishabilityColor(spot.fishabilityScore) }}
              title={`Score: ${spot.fishabilityScore}/100`}
            >
              {spot.fishabilityScore}
            </div>
          ) : (
            <MapPin
              className={`h-8 w-8 transition-transform group-hover:scale-110 ${
                spot.isVerified ? 'text-primary' : 'text-muted-foreground'
              }`}
              fill="currentColor"
            />
          )}
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
              {spot.fishabilityScore != null && (
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: getFishabilityColor(spot.fishabilityScore) }}
                >
                  {spot.fishabilityScore}
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
