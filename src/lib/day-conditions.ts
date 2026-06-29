/**
 * Présentation des « conditions du jour » d'un spot.
 *
 * Logique PURE (aucun fetch, aucun React) servant la carte `SpotFishIndex`
 * reconvertie : à partir des `factors[]` dynamiques déjà renvoyés par
 * `/api/spots/[id]/score`, on produit un comptage favorable/neutre/défavorable
 * et un verdict synthétique « est-ce un bon jour pour y aller ? ».
 *
 * IMPORTANT : on ne calcule AUCUN score ici. Le chiffre global (« 78 ») et le
 * jargon statique/dynamique vivent dans `SpotScorePanel`. Cette couche ne fait
 * que classer/compter des signaux réels — elle n'en invente aucun.
 */

/** Impact pêche d'une condition, tel que renvoyé par la route de score. */
export type ConditionImpact = 'positive' | 'neutral' | 'negative';

/** Un facteur dynamique réel (forme exacte renvoyée par l'API). */
export interface DayConditionFactor {
  name: string;
  impact: ConditionImpact;
  description: string;
}

/** Comptage des facteurs par impact. */
export interface ConditionCounts {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

/** Verdict synthétique « jour de sortie », sans score chiffré. */
export type DayVerdict = 'favorable' | 'mitige' | 'defavorable' | 'inconnu';

export interface DayConditionsSummary {
  counts: ConditionCounts;
  verdict: DayVerdict;
}

/**
 * Compte les facteurs par impact. Pur, total reflète le nombre réel de signaux.
 */
export function countConditions(factors: readonly DayConditionFactor[]): ConditionCounts {
  const counts: ConditionCounts = { positive: 0, neutral: 0, negative: 0, total: factors.length };
  for (const factor of factors) {
    counts[factor.impact] += 1;
  }
  return counts;
}

/**
 * Verdict d'un coup d'œil à partir du seul comptage réel des signaux :
 * - aucun signal → `inconnu` (on ne prétend rien) ;
 * - au moins un défavorable → `defavorable` (signal go/no-go prioritaire) ;
 * - au moins un favorable et aucun défavorable → `favorable` ;
 * - sinon (que du neutre) → `mitige`.
 *
 * On ne pondère pas : un défavorable (crue, sécheresse…) prime, c'est une
 * info de vigilance, pas une moyenne.
 */
export function deriveDayVerdict(counts: ConditionCounts): DayVerdict {
  if (counts.total === 0) return 'inconnu';
  if (counts.negative > 0) return 'defavorable';
  if (counts.positive > 0) return 'favorable';
  return 'mitige';
}

/** Résumé complet (comptage + verdict) en une passe. */
export function summarizeDayConditions(
  factors: readonly DayConditionFactor[],
): DayConditionsSummary {
  const counts = countConditions(factors);
  return { counts, verdict: deriveDayVerdict(counts) };
}

/** Ordre d'affichage : on remonte ce qui demande de l'attention. */
const IMPACT_PRIORITY: Record<ConditionImpact, number> = {
  negative: 0,
  positive: 1,
  neutral: 2,
};

/**
 * Trie les facteurs pour l'affichage : défavorables d'abord (vigilance),
 * puis favorables, puis neutres. Tri stable, ne mute pas l'entrée.
 */
export function sortConditionsForDisplay(
  factors: readonly DayConditionFactor[],
): DayConditionFactor[] {
  return [...factors].sort(
    (a, b) => IMPACT_PRIORITY[a.impact] - IMPACT_PRIORITY[b.impact],
  );
}

/** Libellé FR honnête du verdict (aucune promesse de résultat de pêche). */
export const DAY_VERDICT_LABEL: Record<DayVerdict, string> = {
  favorable: 'Conditions favorables aujourd’hui',
  mitige: 'Conditions mitigées aujourd’hui',
  defavorable: 'Conditions à surveiller aujourd’hui',
  inconnu: 'Conditions du jour indisponibles',
};
