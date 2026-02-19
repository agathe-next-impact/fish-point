'use client';

import { useMemo, useCallback } from 'react';
import { Marker } from 'react-map-gl';
import Supercluster from 'supercluster';
import { useMapStore } from '@/store/map.store';
import { SpotMarker } from './SpotMarker';
import type { SpotListItem } from '@/types/spot';

interface SpotClusterProps {
  spots: SpotListItem[];
  onSpotClick?: (spot: SpotListItem) => void;
}

export function SpotCluster({ spots, onSpotClick }: SpotClusterProps) {
  const viewport = useMapStore((s) => s.viewport);
  const setViewport = useMapStore((s) => s.setViewport);

  const supercluster = useMemo(() => {
    const sc = new Supercluster({
      radius: 60,
      maxZoom: 16,
    });

    const points = spots.map((spot) => ({
      type: 'Feature' as const,
      properties: { ...spot, cluster: false },
      geometry: {
        type: 'Point' as const,
        coordinates: [spot.longitude, spot.latitude],
      },
    }));

    sc.load(points);
    return sc;
  }, [spots]);

  const clusters = useMemo(() => {
    const zoom = Math.floor(viewport.zoom || 6);
    try {
      return supercluster.getClusters([-180, -85, 180, 85], zoom);
    } catch {
      return [];
    }
  }, [supercluster, viewport.zoom]);

  const handleClusterClick = useCallback(
    (clusterId: number, latitude: number, longitude: number) => {
      const zoom = supercluster.getClusterExpansionZoom(clusterId);
      setViewport({ latitude, longitude, zoom });
    },
    [supercluster, setViewport],
  );

  return (
    <>
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const props = cluster.properties;

        if (props.cluster) {
          const size = Math.min(60, 20 + (props.point_count / spots.length) * 40);
          return (
            <Marker
              key={`cluster-${props.cluster_id}`}
              latitude={latitude}
              longitude={longitude}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleClusterClick(props.cluster_id, latitude, longitude);
              }}
            >
              <div
                className="flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs cursor-pointer hover:scale-110 transition-transform shadow-lg"
                style={{ width: size, height: size }}
              >
                {props.point_count}
              </div>
            </Marker>
          );
        }

        const spot = props as unknown as SpotListItem;
        return (
          <SpotMarker
            key={spot.id}
            spot={spot}
            onClick={onSpotClick}
          />
        );
      })}
    </>
  );
}
