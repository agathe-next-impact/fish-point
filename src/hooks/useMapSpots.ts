'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { serializeSpotFilters, type SpotQueryFilters } from '@/lib/spot-filter-params';
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

/**
 * `filterQs` = filtres « sortie »/« affichage » déjà sérialisés (vocabulaire partagé
 * `serializeSpotFilters`). Concaténés aux bornes pour que la bbox carte applique côté
 * serveur EXACTEMENT les mêmes filtres que la liste et les tuiles (sous-étape 5 :
 * suppression de la copie JS de filtrage de `MapContainer`).
 */
async function fetchBboxSpots(bounds: MapBounds, filterQs: string): Promise<SpotListItem[]> {
  const params = new URLSearchParams({
    north: bounds.north.toString(),
    south: bounds.south.toString(),
    east: bounds.east.toString(),
    west: bounds.west.toString(),
    limit: '300',
  });
  // Fusionne les params de filtres (listes multivaluées préservées via append).
  for (const [key, value] of new URLSearchParams(filterQs)) {
    params.append(key, value);
  }

  const res = await fetch(`/api/spots/bbox?${params}`);
  if (!res.ok) throw new Error('Failed to fetch map spots');
  const json = await res.json();
  return json.data;
}

export function useMapSpots(
  { enabled = true, filters }: { enabled?: boolean; filters?: SpotQueryFilters } = {},
) {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [debouncedBounds, setDebouncedBounds] = useState<MapBounds | null>(null);

  useEffect(() => {
    if (!bounds) return;
    const timer = setTimeout(() => setDebouncedBounds(roundBounds(bounds)), 300);
    return () => clearTimeout(timer);
  }, [bounds]);

  // Query string stable des filtres (clé de cache React Query + param serveur).
  const filterQs = useMemo(
    () => (filters ? serializeSpotFilters(filters).toString() : ''),
    [filters],
  );

  const query = useQuery({
    queryKey: ['mapSpots', debouncedBounds, filterQs],
    queryFn: () => fetchBboxSpots(debouncedBounds!, filterQs),
    enabled: enabled && debouncedBounds !== null,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  return {
    spots: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    setBounds,
  };
}
