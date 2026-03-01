import type { WaterType, WaterCategory, FishingType, SpotStatus, Abundance, AccessType } from '@prisma/client';

export type { WaterType, WaterCategory, FishingType, SpotStatus, Abundance, AccessType };

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
  distance?: number;
  fishabilityScore: number | null;
  dataOrigin: string;
  accessType: AccessType | null;
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

export interface SpotImageData {
  id: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  isPrimary: boolean;
  source?: 'user' | 'ign' | 'wikimedia';
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
  fishingTypes?: FishingType[];
  minRating?: number;
  pmr?: boolean;
  nightFishing?: boolean;
  isPremium?: boolean;
  species?: string[];
  department?: string;
  search?: string;
  radius?: number;
  lat?: number;
  lng?: number;
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
