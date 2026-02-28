'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SpotListItem } from '@/types/spot';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

function roundBounds(bounds: MapBounds): MapBounds {
  return {
    north: Math.round(bounds.north * 100) / 100,
    south: Math.round(bounds.south * 100) / 100,
    east: Math.round(bounds.east * 100) / 100,
    west: Math.round(bounds.west * 100) / 100,
  };
}

async function fetchBboxSpots(bounds: MapBounds): Promise<SpotListItem[]> {
  const params = new URLSearchParams({
    north: bounds.north.toString(),
    south: bounds.south.toString(),
    east: bounds.east.toString(),
    west: bounds.west.toString(),
    limit: '500',
  });

  const res = await fetch(`/api/spots/bbox?${params}`);
  if (!res.ok) throw new Error('Failed to fetch map spots');
  const json = await res.json();
  return json.data;
}

export function useMapSpots() {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [debouncedBounds, setDebouncedBounds] = useState<MapBounds | null>(null);

  useEffect(() => {
    if (!bounds) return;
    const timer = setTimeout(() => setDebouncedBounds(roundBounds(bounds)), 300);
    return () => clearTimeout(timer);
  }, [bounds]);

  const query = useQuery({
    queryKey: ['mapSpots', debouncedBounds],
    queryFn: () => fetchBboxSpots(debouncedBounds!),
    enabled: debouncedBounds !== null,
  });

  return {
    spots: query.data ?? [],
    isLoading: query.isLoading,
    setBounds,
  };
}
