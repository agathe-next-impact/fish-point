import type { FishingType } from '@prisma/client';
import { FISHING_TYPE_LABELS } from '@/lib/constants';

/**
 * `Spot.fishingTypes` (enum `FishingType`) mélange deux intentions distinctes côté
 * pêcheur : le **mode** (où l'on se tient — bord / bateau / float-tube) et la
 * **technique** (comment l'on pêche — lancer / mouche / coup…). La colonne SQL est
 * unique ; on la classe ici via un helper PUR (aucune migration) pour exposer
 * DEUX sections de filtres lisibles et corriger la friction « Du bord rangé parmi
 * les techniques ».
 *
 * Source de vérité : enum Prisma `FishingType`
 *   = { SPINNING, FLY, COARSE, CARP, SURFCASTING, TROLLING, FLOAT_TUBE, BOAT, SHORE }.
 */

/** Sous-ensemble « mode » : position du pêcheur. */
export const FISHING_MODE_TYPES = ['SHORE', 'BOAT', 'FLOAT_TUBE'] as const;

/** Sous-ensemble « technique » : manière de pêcher. */
export const FISHING_TECHNIQUE_TYPES = [
  'SPINNING',
  'FLY',
  'COARSE',
  'CARP',
  'SURFCASTING',
  'TROLLING',
] as const;

export type FishingMode = (typeof FISHING_MODE_TYPES)[number];
export type FishingTechnique = (typeof FISHING_TECHNIQUE_TYPES)[number];

export type FishingTypeKind = 'mode' | 'technique';

const MODE_SET = new Set<string>(FISHING_MODE_TYPES);

/**
 * Classe une valeur de `FishingType` en `'mode'` ou `'technique'`.
 * Pur, déterministe, sans I/O — testé unitairement.
 */
export function classifyFishingType(type: FishingType): FishingTypeKind {
  return MODE_SET.has(type) ? 'mode' : 'technique';
}

/** Libellé FR d'un `FishingType` (réutilise la table de libellés partagée). */
export function fishingTypeLabel(type: FishingType): string {
  return FISHING_TYPE_LABELS[type] ?? type;
}

/** Options { value, label } pour la section « Mode ». */
export const FISHING_MODE_OPTIONS: ReadonlyArray<{ value: FishingMode; label: string }> =
  FISHING_MODE_TYPES.map((value) => ({ value, label: fishingTypeLabel(value) }));

/** Options { value, label } pour la section « Technique ». */
export const FISHING_TECHNIQUE_OPTIONS: ReadonlyArray<{
  value: FishingTechnique;
  label: string;
}> = FISHING_TECHNIQUE_TYPES.map((value) => ({ value, label: fishingTypeLabel(value) }));
