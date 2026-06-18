/**
 * FishSpot — Fiabilité des données (helper pur).
 *
 * Dérive un palier de confiance « élevée / moyenne / faible » à partir de
 * SIGNAUX RÉELS déjà présents dans `SpotDetail` et la route de score — sans
 * inventer de sous-score :
 *   - `accessDetails.confidence` (0-100, ratio de vote des signaux d'accès) ;
 *   - fraîcheur de la dernière vérification (`lastCheckedAt` / `scoreUpdatedAt`) ;
 *   - présence/absence de données structurantes (espèces, qualité d'eau,
 *     observations).
 *
 * Ce module est volontairement pur (aucun I/O, aucun React) pour être testable
 * et réutilisable côté fiche, carte et liste.
 */

export type ReliabilityTier = 'high' | 'medium' | 'low';

export interface ReliabilityInput {
  /** `accessDetails.confidence` — 0-100, ou null si l'accès n'est pas détecté. */
  accessConfidence: number | null;
  /** Date ISO de la dernière vérification de l'accès (`accessDetails.lastCheckedAt`). */
  lastCheckedAt: string | null;
  /** Date ISO du dernier recalcul du score (`scoreUpdatedAt`), si disponible. */
  scoreUpdatedAt: string | null;
  /** Nombre d'espèces renseignées sur le spot. */
  speciesCount: number;
  /** true si au moins une mesure de qualité d'eau est disponible. */
  hasWaterQuality: boolean;
  /** true si au moins une observation piscicole vérifiée est disponible. */
  hasObservations: boolean;
  /** Horodatage de référence (injecté pour la testabilité). Défaut : maintenant. */
  now?: Date;
}

export interface ReliabilityResult {
  tier: ReliabilityTier;
  /** Libellé FR prêt à afficher. */
  label: string;
  /** Raisons concrètes (signaux réels) expliquant le palier. */
  reasons: string[];
}

const TIER_LABELS: Record<ReliabilityTier, string> = {
  high: 'élevée',
  medium: 'moyenne',
  low: 'faible',
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Âge en jours d'une date ISO, ou null si absente/invalide. */
function ageInDays(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, (now.getTime() - t) / DAY_MS);
}

/**
 * Calcule le palier de fiabilité des données à partir des signaux réels.
 *
 * Méthode : on additionne des points sur trois axes (confiance d'accès,
 * fraîcheur, complétude des données) puis on mappe le total sur un palier.
 * Aucun de ces points n'est exposé à l'utilisateur comme un « sous-score » —
 * seuls le palier et ses raisons concrètes le sont.
 */
export function computeReliability(input: ReliabilityInput): ReliabilityResult {
  const now = input.now ?? new Date();
  const reasons: string[] = [];
  let points = 0;

  // ── Axe 1 : confiance de détection d'accès (0-100) ──────────────
  if (input.accessConfidence === null) {
    reasons.push("Type d'accès non vérifié");
  } else if (input.accessConfidence >= 70) {
    points += 2;
    reasons.push(`Accès confirmé (${Math.round(input.accessConfidence)}% de concordance)`);
  } else if (input.accessConfidence >= 40) {
    points += 1;
    reasons.push(`Accès probable (${Math.round(input.accessConfidence)}% de concordance)`);
  } else {
    reasons.push(`Accès incertain (${Math.round(input.accessConfidence)}% de concordance)`);
  }

  // ── Axe 2 : fraîcheur (on retient la vérification la plus récente) ──
  const checkAge = ageInDays(input.lastCheckedAt, now);
  const scoreAge = ageInDays(input.scoreUpdatedAt, now);
  const freshest =
    checkAge === null ? scoreAge : scoreAge === null ? checkAge : Math.min(checkAge, scoreAge);

  if (freshest === null) {
    reasons.push('Aucune date de vérification connue');
  } else if (freshest <= 7) {
    points += 2;
    reasons.push('Données vérifiées récemment (moins de 7 jours)');
  } else if (freshest <= 90) {
    points += 1;
    reasons.push(`Dernière vérification il y a ${Math.round(freshest)} jours`);
  } else {
    reasons.push(`Dernière vérification ancienne (plus de ${Math.round(freshest / 30)} mois)`);
  }

  // ── Axe 3 : complétude des données ──────────────────────────────
  let completeness = 0;
  if (input.speciesCount > 0) completeness += 1;
  if (input.hasWaterQuality) completeness += 1;
  if (input.hasObservations) completeness += 1;

  points += completeness >= 3 ? 2 : completeness >= 1 ? 1 : 0;
  if (completeness >= 3) {
    reasons.push('Espèces, qualité d’eau et observations renseignées');
  } else if (completeness >= 1) {
    const present: string[] = [];
    if (input.speciesCount > 0) present.push('espèces');
    if (input.hasWaterQuality) present.push('qualité d’eau');
    if (input.hasObservations) present.push('observations');
    reasons.push(`Données partielles (${present.join(', ')})`);
  } else {
    reasons.push('Aucune donnée structurée (espèces, qualité d’eau, observations)');
  }

  // ── Mapping points → palier ─────────────────────────────────────
  // Total possible : 6. Élevée ≥ 5, moyenne 3-4, faible < 3.
  const tier: ReliabilityTier = points >= 5 ? 'high' : points >= 3 ? 'medium' : 'low';

  return { tier, label: TIER_LABELS[tier], reasons };
}
