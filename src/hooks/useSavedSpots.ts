'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { getSavedSpots, type SavedSpotRecord } from '@/lib/offline-db';
import { sortByDistance } from '@/lib/geo-distance';
import type { WaterType } from '@/types/spot';

/**
 * Vue minimale d'un spot enregistré, COMMUNE aux deux sources :
 * - serveur (utilisateur connecté → modèle `Favorite` + `spot`),
 * - local IndexedDB (visiteur → `offline-db`, valeur immédiate avant login).
 *
 * On reste volontairement sur le plus petit dénominateur commun affichable : le
 * store invité ne connaît que id/slug/nom/coordonnées. Les métadonnées riches
 * (note, score) ne sont peuplées que côté serveur ; l'UI les traite en optionnel.
 */
export interface SavedSpotView {
  spotId: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  department: string | null;
  waterType: WaterType | null;
  /** Distance en mètres depuis la position de l'utilisateur, si géoloc connue. */
  distance?: number;
  /** Provenance : sync multi-appareils (serveur) vs local seul (invité). */
  source: 'server' | 'local';
}

/** Forme réelle d'un favori renvoyé par GET /api/spots/favorites (cf. route handler). */
interface ServerFavorite {
  spotId: string;
  spot: {
    id: string;
    name: string;
    slug: string;
    latitude: number;
    longitude: number;
    department: string;
    waterType: WaterType;
  } | null;
}

async function fetchServerFavorites(): Promise<SavedSpotView[]> {
  const res = await fetch('/api/spots/favorites');
  if (!res.ok) throw new Error('Échec du chargement des spots enregistrés');
  const json: { data: ServerFavorite[] } = await res.json();

  return json.data
    .filter((fav): fav is ServerFavorite & { spot: NonNullable<ServerFavorite['spot']> } => fav.spot !== null)
    .map((fav) => ({
      spotId: fav.spot.id,
      slug: fav.spot.slug,
      name: fav.spot.name,
      latitude: fav.spot.latitude,
      longitude: fav.spot.longitude,
      department: fav.spot.department,
      waterType: fav.spot.waterType,
      source: 'server' as const,
    }));
}

function mapLocalRecords(records: SavedSpotRecord[]): SavedSpotView[] {
  return records.map((rec) => ({
    spotId: rec.spotId,
    slug: rec.slug,
    name: rec.name,
    latitude: rec.latitude,
    longitude: rec.longitude,
    department: null,
    waterType: null,
    source: 'local' as const,
  }));
}

interface UseSavedSpotsResult {
  spots: SavedSpotView[];
  isLoading: boolean;
  isError: boolean;
  /** `true` pour un visiteur non connecté (source locale uniquement). */
  isGuest: boolean;
}

/**
 * Source unique des spots enregistrés pour l'espace « Enregistrés ».
 *
 * - Connecté → GET /api/spots/favorites (persistance réelle, sync multi-appareils).
 * - Invité   → offline-db (IndexedDB), valeur immédiate sans mur de connexion.
 *
 * Les résultats sont triés par distance croissante quand `origin` est fourni
 * (géoloc), sinon laissés dans l'ordre d'enregistrement (récent → ancien côté
 * serveur). `distance` (mètres) est renseignée pour l'affichage.
 */
export function useSavedSpots(origin: { latitude: number; longitude: number } | null): UseSavedSpotsResult {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  // Source serveur (connecté).
  const serverQuery = useQuery({
    queryKey: ['saved-spots', 'server'],
    queryFn: fetchServerFavorites,
    enabled: isAuthenticated,
  });

  // Source locale (invité) — IndexedDB via React Query (`enabled` hors connexion),
  // pour éviter un setState synchrone dans un effet. Connecté, on ignore simplement
  // le store local (la fusion invité→compte est une slice ultérieure).
  const localQuery = useQuery({
    queryKey: ['saved-spots', 'local'],
    queryFn: async () => mapLocalRecords(await getSavedSpots()),
    enabled: !isAuthenticated,
  });

  const spots = useMemo(() => {
    const base = isAuthenticated ? (serverQuery.data ?? []) : (localQuery.data ?? []);
    return sortByDistance(base, origin);
  }, [isAuthenticated, serverQuery.data, localQuery.data, origin]);

  return {
    spots,
    isLoading: isAuthenticated ? serverQuery.isLoading : localQuery.isLoading,
    isError: isAuthenticated ? serverQuery.isError : false,
    isGuest: !isAuthenticated,
  };
}
