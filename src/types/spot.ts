import type { WaterType, WaterCategory, FishingType, SpotStatus, Abundance, AccessType, SpotKind } from '@prisma/client';

export type { WaterType, WaterCategory, FishingType, SpotStatus, Abundance, AccessType, SpotKind };

export interface SpotAccessibility {
  pmr: boolean;
  parking: boolean;
  boatLaunch: boolean;
  nightFishing: boolean;
}

export interface SpotListItem {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  department: string;
  commune: string | null;
  waterType: WaterType;
  waterCategory: WaterCategory | null;
  fishingTypes: FishingType[];
  averageRating: number;
  reviewCount: number;
  isPremium: boolean;
  isVerified: boolean;
  primaryImage: string | null;
  accessibility?: SpotAccessibility | null;
  distance?: number;
  fishabilityScore: number | null;
  dataOrigin: string;
  accessType: AccessType | null;
  /**
   * Niveau du spot (modèle 3 niveaux) : `WATER_BODY` = plan d'eau public,
   * `ACCESS_ZONE` = zone/accès public rattaché à un plan d'eau parent. Lecture passive
   * (slice 1) : aucun filtre par défaut ni affichage ne le consomme encore. `parentId`
   * pointe vers le plan d'eau parent d'une `ACCESS_ZONE` (null pour un `WATER_BODY`).
   */
  kind: SpotKind;
  parentId: string | null;
  /**
   * Espèces documentées du spot (jointure légère `speciesId`+`abundance`, ajoutée au
   * `spotListSelect`). Sert au verdict « Adapté à votre sortie » par item de liste
   * (différenciateur = abondance de l'espèce ciblée). `SpotDetail` le spécialise en
   * `SpotSpeciesData[]` (sur-ensemble compatible).
   */
  species?: Array<{ speciesId: string; abundance: Abundance }>;
}

export interface AccessDetails {
  signals: Array<{
    source: string;
    signal: string;
    accessType: string;
    confidence: 'high' | 'medium' | 'low';
    details?: string;
  }>;
  confidence: number;
  lastCheckedAt: string;
}

export interface SpotDetail extends SpotListItem {
  description: string | null;
  accessibility: SpotAccessibility | null;
  accessDetails: AccessDetails | null;
  status: SpotStatus;
  viewCount: number;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
  images: SpotImageData[];
  species: SpotSpeciesData[];
  regulations: SpotRegulationData[];
}

/**
 * Résumé d'une zone d'accès public (modèle 3 niveaux) listée sur la fiche de son plan
 * d'eau parent (bloc « Accès publics »). Forme d'affichage légère, pas la fiche complète.
 */
export interface SpotAccessZoneSummary {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  accessType: AccessType | null;
}

/** Résumé du plan d'eau parent, pour le bandeau « Cet accès appartient à … ». */
export interface SpotParentSummary {
  id: string;
  slug: string;
  name: string;
}

export interface SpotImageData {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  isPrimary: boolean;
  source?: 'user' | 'ign' | 'wikimedia' | 'unsplash';
  photographerName?: string;
  photographerUrl?: string;
}

export interface SpotSpeciesData {
  id: string;
  speciesId: string;
  name: string;
  scientificName: string | null;
  category: string;
  abundance: Abundance;
  minLegalSize: number | null;
  maxLengthCm: number | null;
  maxWeightKg: number | null;
  optimalTempMin: number | null;
  optimalTempMax: number | null;
  feedingType: string | null;
  habitat: string | null;
  spawnMonthStart: number | null;
  spawnMonthEnd: number | null;
}

export interface SpotRegulationData {
  id: string;
  type: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  source: string | null;
}

export interface SpotFilters {
  waterType?: WaterType[];
  waterCategory?: WaterCategory;
  fishingTypes?: FishingType[];
  fishCategory?: string[];
  accessType?: string;
  minRating?: number;
  minFishabilityScore?: number;
  maxFishabilityScore?: number;
  pmr?: boolean;
  nightFishing?: boolean;
  isPremium?: boolean;
  species?: string[];
  department?: string;
  search?: string;
  radius?: number;
  lat?: number;
  lng?: number;
  /** Bornes géographiques (zone Explorer committée) — bornent la liste à la fenêtre carte. */
  north?: number;
  south?: number;
  east?: number;
  west?: number;
}

export interface SpotCreateInput {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  waterType: WaterType;
  waterCategory?: WaterCategory;
  fishingTypes: FishingType[];
  accessibility?: SpotAccessibility;
  species?: { speciesId: string; abundance: Abundance }[];
}

export interface SpotUpdateInput extends Partial<SpotCreateInput> {
  status?: SpotStatus;
}

export interface GeoSpotQuery {
  lat: number;
  lng: number;
  radius: number;
  limit?: number;
  offset?: number;
  filters?: SpotFilters;
}
