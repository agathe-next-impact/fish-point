'use client';

import { Marker, Popup } from 'react-map-gl/mapbox';
import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Star, Fish, Anchor, Flag, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PrivateSpotSummary } from '@/types/private-spot';

interface PrivateSpotMarkerProps {
  spot: PrivateSpotSummary;
  onClick?: (spot: PrivateSpotSummary) => void;
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

export function PrivateSpotMarker({ spot, onClick }: PrivateSpotMarkerProps) {
  const [showPopup, setShowPopup] = useState(false);
  const IconComponent = getIconComponent(spot.icon);
  const color = spot.color || '#3b82f6';

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
        <div className="cursor-pointer group relative">
          <div
            className="flex items-center justify-center h-8 w-8 rounded-full shadow-md transition-transform group-hover:scale-110 border-2 border-white"
            style={{ backgroundColor: color }}
          >
            <IconComponent className="h-4 w-4 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 bg-gray-800 rounded-full p-0.5">
            <Lock className="h-2.5 w-2.5 text-white" />
          </div>
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
          className="private-spot-popup"
        >
          <div className="p-2 min-w-[200px]">
            <div className="flex items-center gap-1.5 mb-1">
              <Lock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Spot prive
              </span>
            </div>
            <h3 className="font-semibold text-sm mb-1">{spot.name}</h3>
            {spot.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {spot.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mb-2">
              {spot.visitCount} visite{spot.visitCount !== 1 ? 's' : ''}
            </p>
            <Link href={`/my-spots/${spot.id}`}>
              <Button size="sm" className="w-full text-xs">
                Voir detail
              </Button>
            </Link>
          </div>
        </Popup>
      )}
    </>
  );
}
