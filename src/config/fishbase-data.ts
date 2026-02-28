/**
 * Static FishBase data for the 25 species in the fish-point catalog.
 * Source: FishBase (fishbase.org) — species, ecology, spawning, and poplw tables.
 *
 * weightLengthA / weightLengthB are NOT stored in DB — used only at runtime
 * for catch plausibility checks (W(kg) = a × L(cm)^b).
 */

export interface FishBaseData {
  maxLengthCm: number | null;
  maxWeightKg: number | null;
  optimalTempMin: number | null;
  optimalTempMax: number | null;
  feedingType: string | null;
  habitat: string | null;
  spawnMonthStart: number | null;
  spawnMonthEnd: number | null;
  weightLengthA: number | null;
  weightLengthB: number | null;
}

export const FISHBASE_DATA: Record<string, FishBaseData> = {
  // --- Carnassiers ---
  'Esox lucius': {
    maxLengthCm: 150, maxWeightKg: 28.4,
    optimalTempMin: 10, optimalTempMax: 20,
    feedingType: 'carnivore', habitat: 'benthopelagic',
    spawnMonthStart: 3, spawnMonthEnd: 4,
    weightLengthA: 0.0083, weightLengthB: 3.093,
  },
  'Sander lucioperca': {
    maxLengthCm: 100, maxWeightKg: 18.0,
    optimalTempMin: 10, optimalTempMax: 22,
    feedingType: 'carnivore', habitat: 'benthopelagic',
    spawnMonthStart: 4, spawnMonthEnd: 5,
    weightLengthA: 0.0089, weightLengthB: 3.12,
  },
  'Perca fluviatilis': {
    maxLengthCm: 60, maxWeightKg: 4.75,
    optimalTempMin: 10, optimalTempMax: 22,
    feedingType: 'carnivore', habitat: 'benthopelagic',
    spawnMonthStart: 4, spawnMonthEnd: 5,
    weightLengthA: 0.016, weightLengthB: 3.03,
  },
  'Micropterus salmoides': {
    maxLengthCm: 97, maxWeightKg: 10.1,
    optimalTempMin: 15, optimalTempMax: 28,
    feedingType: 'carnivore', habitat: 'benthopelagic',
    spawnMonthStart: 5, spawnMonthEnd: 6,
    weightLengthA: 0.0132, weightLengthB: 3.09,
  },

  // --- Silures ---
  'Silurus glanis': {
    maxLengthCm: 500, maxWeightKg: 306.0,
    optimalTempMin: 18, optimalTempMax: 25,
    feedingType: 'carnivore', habitat: 'demersal',
    spawnMonthStart: 5, spawnMonthEnd: 6,
    weightLengthA: 0.0032, weightLengthB: 3.27,
  },

  // --- Salmonidés ---
  'Salmo trutta fario': {
    maxLengthCm: 140, maxWeightKg: 60.0,
    optimalTempMin: 7, optimalTempMax: 16,
    feedingType: 'carnivore', habitat: 'benthopelagic',
    spawnMonthStart: 10, spawnMonthEnd: 3, // spans year boundary
    weightLengthA: 0.0094, weightLengthB: 3.08,
  },
  'Oncorhynchus mykiss': {
    maxLengthCm: 120, maxWeightKg: 25.4,
    optimalTempMin: 10, optimalTempMax: 18,
    feedingType: 'carnivore', habitat: 'benthopelagic',
    spawnMonthStart: 1, spawnMonthEnd: 4,
    weightLengthA: 0.0108, weightLengthB: 3.05,
  },
  'Salmo salar': {
    maxLengthCm: 150, maxWeightKg: 46.8,
    optimalTempMin: 6, optimalTempMax: 16,
    feedingType: 'carnivore', habitat: 'benthopelagic',
    spawnMonthStart: 11, spawnMonthEnd: 1, // spans year boundary
    weightLengthA: 0.0088, weightLengthB: 3.14,
  },
  'Thymallus thymallus': {
    maxLengthCm: 60, maxWeightKg: 6.7,
    optimalTempMin: 5, optimalTempMax: 15,
    feedingType: 'omnivore', habitat: 'benthopelagic',
    spawnMonthStart: 3, spawnMonthEnd: 5,
    weightLengthA: 0.0089, weightLengthB: 3.15,
  },
  'Salvelinus alpinus': {
    maxLengthCm: 107, maxWeightKg: 15.1,
    optimalTempMin: 4, optimalTempMax: 13,
    feedingType: 'carnivore', habitat: 'benthopelagic',
    spawnMonthStart: 10, spawnMonthEnd: 12,
    weightLengthA: 0.0082, weightLengthB: 3.09,
  },

  // --- Cyprinidés ---
  'Cyprinus carpio': {
    maxLengthCm: 120, maxWeightKg: 40.1,
    optimalTempMin: 18, optimalTempMax: 28,
    feedingType: 'omnivore', habitat: 'benthopelagic',
    spawnMonthStart: 5, spawnMonthEnd: 6,
    weightLengthA: 0.0141, weightLengthB: 3.02,
  },
  'Cyprinus carpio carpio': {
    maxLengthCm: 120, maxWeightKg: 40.1,
    optimalTempMin: 18, optimalTempMax: 28,
    feedingType: 'omnivore', habitat: 'benthopelagic',
    spawnMonthStart: 5, spawnMonthEnd: 6,
    weightLengthA: 0.0141, weightLengthB: 3.02,
  },
  'Tinca tinca': {
    maxLengthCm: 70, maxWeightKg: 7.5,
    optimalTempMin: 18, optimalTempMax: 26,
    feedingType: 'omnivore', habitat: 'demersal',
    spawnMonthStart: 5, spawnMonthEnd: 7,
    weightLengthA: 0.0158, weightLengthB: 3.04,
  },
  'Rutilus rutilus': {
    maxLengthCm: 50, maxWeightKg: 2.0,
    optimalTempMin: 12, optimalTempMax: 22,
    feedingType: 'omnivore', habitat: 'benthopelagic',
    spawnMonthStart: 4, spawnMonthEnd: 5,
    weightLengthA: 0.0106, weightLengthB: 3.08,
  },
  'Abramis brama': {
    maxLengthCm: 82, maxWeightKg: 9.1,
    optimalTempMin: 14, optimalTempMax: 24,
    feedingType: 'omnivore', habitat: 'benthopelagic',
    spawnMonthStart: 5, spawnMonthEnd: 6,
    weightLengthA: 0.0137, weightLengthB: 3.04,
  },
  'Squalius cephalus': {
    maxLengthCm: 80, maxWeightKg: 8.0,
    optimalTempMin: 14, optimalTempMax: 24,
    feedingType: 'omnivore', habitat: 'benthopelagic',
    spawnMonthStart: 5, spawnMonthEnd: 6,
    weightLengthA: 0.0097, weightLengthB: 3.12,
  },
  'Barbus barbus': {
    maxLengthCm: 120, maxWeightKg: 12.0,
    optimalTempMin: 12, optimalTempMax: 22,
    feedingType: 'omnivore', habitat: 'demersal',
    spawnMonthStart: 5, spawnMonthEnd: 6,
    weightLengthA: 0.0096, weightLengthB: 3.09,
  },
  'Gobio gobio': {
    maxLengthCm: 25, maxWeightKg: 0.3,
    optimalTempMin: 12, optimalTempMax: 22,
    feedingType: 'omnivore', habitat: 'demersal',
    spawnMonthStart: 5, spawnMonthEnd: 6,
    weightLengthA: 0.0063, weightLengthB: 3.19,
  },
  'Alburnus alburnus': {
    maxLengthCm: 25, maxWeightKg: 0.2,
    optimalTempMin: 12, optimalTempMax: 24,
    feedingType: 'omnivore', habitat: 'pelagic',
    spawnMonthStart: 5, spawnMonthEnd: 6,
    weightLengthA: 0.0065, weightLengthB: 3.09,
  },
  'Scardinius erythrophthalmus': {
    maxLengthCm: 51, maxWeightKg: 2.27,
    optimalTempMin: 16, optimalTempMax: 26,
    feedingType: 'herbivore', habitat: 'benthopelagic',
    spawnMonthStart: 5, spawnMonthEnd: 6,
    weightLengthA: 0.016, weightLengthB: 3.01,
  },

  // --- Marins ---
  'Dicentrarchus labrax': {
    maxLengthCm: 103, maxWeightKg: 12.0,
    optimalTempMin: 12, optimalTempMax: 26,
    feedingType: 'carnivore', habitat: 'benthopelagic',
    spawnMonthStart: 1, spawnMonthEnd: 3,
    weightLengthA: 0.0107, weightLengthB: 2.99,
  },
  'Sparus aurata': {
    maxLengthCm: 70, maxWeightKg: 17.2,
    optimalTempMin: 14, optimalTempMax: 28,
    feedingType: 'carnivore', habitat: 'demersal',
    spawnMonthStart: 11, spawnMonthEnd: 12,
    weightLengthA: 0.0149, weightLengthB: 3.04,
  },
  'Scomber scombrus': {
    maxLengthCm: 66, maxWeightKg: 3.4,
    optimalTempMin: 10, optimalTempMax: 20,
    feedingType: 'carnivore', habitat: 'pelagic',
    spawnMonthStart: 5, spawnMonthEnd: 7,
    weightLengthA: 0.0055, weightLengthB: 3.07,
  },
  'Pollachius pollachius': {
    maxLengthCm: 130, maxWeightKg: 18.7,
    optimalTempMin: 10, optimalTempMax: 18,
    feedingType: 'carnivore', habitat: 'benthopelagic',
    spawnMonthStart: 1, spawnMonthEnd: 4,
    weightLengthA: 0.0079, weightLengthB: 3.1,
  },
  'Solea solea': {
    maxLengthCm: 70, maxWeightKg: 3.0,
    optimalTempMin: 10, optimalTempMax: 24,
    feedingType: 'carnivore', habitat: 'demersal',
    spawnMonthStart: 3, spawnMonthEnd: 5,
    weightLengthA: 0.0052, weightLengthB: 3.21,
  },
};

/**
 * Get FishBase data by scientific name.
 */
export function getFishBaseData(scientificName: string): FishBaseData | null {
  return FISHBASE_DATA[scientificName] ?? null;
}

/**
 * Estimate weight from length using W = a × L^b relationship.
 * @param lengthCm - fish length in cm
 * @param a - coefficient a
 * @param b - exponent b
 * @returns weight in kg
 */
export function estimateWeightFromLength(
  lengthCm: number,
  a: number,
  b: number,
): number {
  return a * Math.pow(lengthCm, b);
}
