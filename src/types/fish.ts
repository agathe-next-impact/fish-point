import type { FishCategory } from '@prisma/client';

export type { FishCategory };

export interface FishSpeciesData {
  id: string;
  name: string;
  scientificName: string | null;
  category: FishCategory;
  minLegalSize: number | null;
  imageUrl: string | null;
  maxLengthCm: number | null;
  maxWeightKg: number | null;
  optimalTempMin: number | null;
  optimalTempMax: number | null;
  feedingType: string | null;
  habitat: string | null;
  spawnMonthStart: number | null;
  spawnMonthEnd: number | null;
}

export interface FishActivityIndex {
  score: number;
  label: string;
  color: string;
  factors: FishActivityFactor[];
}

export interface FishActivityFactor {
  name: string;
  impact: 'positive' | 'neutral' | 'negative';
  description: string;
}
