/**
 * Formatage des noms de spots à l'AFFICHAGE uniquement.
 *
 * Contexte : certains spots auto-découverts (imports OFB/externes) ont un nom
 * portant un suffixe technique de la forme `(DEPT-EXTERNALID)` — ex.
 * « Jetée (01-25797529) » ou « Spot de pêche (74-10922417460) ». Affiché tel
 * quel, ce suffixe donne l'impression d'une base non qualifiée. D'autres ont une
 * base générique (« Spot de pêche ») peu informative.
 *
 * Ce helper est PUR (aucun I/O, aucune dépendance React) et CONSERVATEUR : il ne
 * nettoie QUE le pattern auto-généré. Un vrai nom utilisateur (sans suffixe
 * technique en fin de chaîne) est renvoyé inchangé.
 *
 * ⚠ Aucune écriture en base : la donnée stockée n'est pas modifiée, on reformate
 * seulement au rendu (liste, fiche, popup marqueur).
 */

import { WATER_TYPE_LABELS } from '@/lib/constants';

/**
 * Suffixe technique en FIN de nom : `(<chiffres>-<chiffres>)`, éventuellement
 * précédé d'espaces. On ancre sur `$` pour ne jamais toucher une parenthèse
 * légitime au milieu d'un nom (ex. « Étang (réserve) »).
 */
const TECHNICAL_SUFFIX_RE = /\s*\(\d+-\d+\)\s*$/;

/**
 * Bases génériques : noms qui n'apportent aucune information de lieu une fois le
 * suffixe technique retiré. Comparaison insensible à la casse et aux accents
 * superflus (on normalise sur du lower-case trimé).
 */
const GENERIC_BASES = new Set(['spot de pêche', 'spot de peche', 'spot']);

export interface FormatSpotNameInput {
  /** Nom brut stocké en base (peut contenir le suffixe technique). */
  name: string;
  /** Commune rattachée au spot, si connue. */
  commune?: string | null;
  /** Type d'eau (enum Prisma WaterType) — repli quand la commune manque. */
  waterType?: string | null;
}

/**
 * Retourne un libellé lisible et NON vide pour l'affichage.
 *
 * Règles, dans l'ordre :
 * 1. Retire le suffixe technique `(\d+-\d+)` en fin de nom.
 * 2. Si la base restante est générique (« Spot de pêche ») ou vide, construit un
 *    libellé à partir de `commune` et/ou `waterType` :
 *      - commune connue            → « Spot de pêche à <Commune> »
 *      - sinon waterType connu      → « Spot de pêche — <Type d'eau> »
 *      - sinon                      → « Spot de pêche » (jamais vide)
 * 3. Si la base restante est un vrai nom (« Jetée », « Pont de la Caille »… ) :
 *      - commune connue            → « <Base> — <Commune> »
 *      - sinon                      → « <Base> » tel quel.
 * 4. Aucun suffixe technique ET base non générique ET pas de contexte ajouté
 *    utile → renvoyé strictement inchangé (cas du vrai nom utilisateur).
 */
export function formatSpotName({ name, commune, waterType }: FormatSpotNameInput): string {
  const raw = (name ?? '').trim();
  const stripped = raw.replace(TECHNICAL_SUFFIX_RE, '').trim();
  const hadTechnicalSuffix = stripped !== raw;

  const cleanCommune = commune?.trim() || null;
  const waterLabel = waterType ? WATER_TYPE_LABELS[waterType] ?? null : null;

  const isGeneric = stripped === '' || GENERIC_BASES.has(stripped.toLowerCase());

  if (isGeneric) {
    if (cleanCommune) return `Spot de pêche à ${cleanCommune}`;
    if (waterLabel) return `Spot de pêche — ${waterLabel}`;
    return 'Spot de pêche';
  }

  // Vrai nom (« Jetée », « Pont de la Caille »…).
  // On n'enrichit avec la commune QUE si on a nettoyé un suffixe technique :
  // un nom auto-généré « Jetée (74-…) » devient « Jetée — Annecy » (utile pour
  // lever l'ambiguïté entre homonymes). Un nom utilisateur propre reste intact.
  if (hadTechnicalSuffix && cleanCommune) {
    return `${stripped} — ${cleanCommune}`;
  }

  return stripped;
}
