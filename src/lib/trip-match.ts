/**
 * FishSpot — « Adapté à VOTRE sortie » (helper pur).
 *
 * Calcule un score PERSONNALISÉ par requête de sortie (espèce + mode + distance)
 * croisé avec les conditions du jour et les qualités du spot. C'est l'indicateur
 * dynamique distinct du « 78 » global (`fishabilityScore`) : ce dernier reste le
 * score GLOBAL du spot, volontairement non personnalisé (cf. SpotScorePanel).
 *
 * ⚠ HONNÊTETÉ — règles non négociables encodées ici :
 *   - On ne calcule un verdict que si un contexte « sortie » réel existe (au
 *     minimum une espèce ciblée). L'appelant garde sinon l'affichage global.
 *   - Dimension DATE : il n'existe AUCUNE prévision de pêchabilité par date
 *     future. Le sous-score « conditions » s'appuie sur le `dynamicScore`
 *     ACTUEL (conditions du jour). On n'invente pas de score pour une date.
 *   - Composant manquant (ex. activité récente vide faute de prise publique) :
 *     on NORMALISE le barème sur les seuls composants réellement disponibles
 *     plutôt que de compter un 0 dur — un signal absent n'est pas « inadapté ».
 *     Le `note` du breakdown explicite ce qui manque.
 *   - Aucune valeur inventée : chaque sous-score dérive d'une donnée réelle
 *     fournie par l'appelant (SpotSpecies, /score, geo-distance, régulations,
 *     reliability).
 *
 * Barème CIBLE (somme = 100) :
 *   Espèce recherchée /30 · Conditions prévues /20 · Activité récente /20 ·
 *   Distance & accès /15 · Réglementation /10 · Fiabilité /5.
 *
 * Pur, déterministe, sans I/O ni React — testé (`tests/unit/lib/trip-match.test.ts`).
 */

import type { Abundance } from '@prisma/client';
import type { ReliabilityTier } from '@/lib/reliability';
import { haversineMeters } from '@/lib/geo-distance';

/** Statut réglementaire dérivé des régulations actives du spot. */
export type RegulationStatus =
  /** Interdiction permanente / saisonnière active : aucune sortie possible. */
  | 'banned'
  /** Alerte active (pollution, crue, sécheresse) : praticable mais à surveiller. */
  | 'restricted'
  /** Aucune régulation bloquante connue (réserve : non vérifié ≠ autorisé). */
  | 'clear'
  /** Réglementation locale non vérifiée — on ne sait pas. */
  | 'unknown';

/** Espèce documentée sur le spot (sous-ensemble de `SpotSpeciesData`). */
export interface TripMatchSpecies {
  /** Identifiant stable de l'espèce (`SpotSpeciesData.speciesId`). */
  speciesId: string;
  /** Abondance déclarée de l'espèce sur ce spot. */
  abundance: Abundance;
}

/** Agrégat « activité récente » réel (sous-ensemble de `spot-catches`). */
export interface TripMatchActivity {
  /** Identifiant de l'espèce concernée par l'agrégat de prises. */
  speciesId: string;
  /** Nombre de prises publiques récentes pour cette espèce. */
  count: number;
}

export interface TripMatchInput {
  /**
   * Espèce(s) ciblée(s) par la sortie (`speciesId`), lue du contexte sortie.
   * Vide/absent ⇒ pas de contexte sortie : l'appelant ne doit alors PAS appeler
   * cette fonction (il garde l'indice global). On le tolère défensivement.
   */
  targetSpecies: readonly string[];
  /** Espèces réellement documentées sur le spot. */
  spotSpecies: readonly TripMatchSpecies[];
  /**
   * Score de conditions ACTUELLES (0-100), `dynamicScore` de `/api/spots/[id]/score`.
   * `null` si indisponible ⇒ composant normalisé hors barème.
   */
  conditionsScore: number | null;
  /**
   * Distance à vol d'oiseau en MÈTRES depuis la position de l'utilisateur
   * (haversine). `null` si la position n'est pas connue ⇒ composant normalisé
   * hors barème (on ne pénalise pas une distance inconnue).
   */
  distanceMeters: number | null;
  /**
   * Accès physique au bord praticable, si connu. `null` ⇒ inconnu (n'entre pas
   * dans le sous-score, mais ne le pénalise pas).
   */
  accessible: boolean | null;
  /**
   * Statut réglementaire dérivé des régulations actives. `null` ⇒ régulations non
   * chargées par cet appelant (ex. liste Explorer, qui ne joint pas les régulations
   * pour rester léger) ⇒ composant normalisé hors barème. À ne PAS confondre avec
   * `'unknown'` (régulations chargées mais non vérifiées, mi-points appliqués).
   */
  regulationStatus: RegulationStatus | null;
  /**
   * Palier de fiabilité des données (helper `reliability`). `null` ⇒ signaux de
   * fiabilité non disponibles pour cet appelant (ex. liste Explorer) ⇒ composant
   * normalisé hors barème (ni gagné ni perdu).
   */
  reliability: ReliabilityTier | null;
  /**
   * Activité récente réelle (agrégat public). Souvent VIDE en prod (aucune prise
   * publique) ⇒ composant normalisé hors barème, jamais compté comme un 0 dur.
   */
  recentActivity: readonly TripMatchActivity[];
}

/** Une ligne du détail consultable du verdict. */
export interface TripMatchFactor {
  /** Libellé FR de la dimension. */
  label: string;
  /** Points obtenus sur cette dimension (arrondi). */
  points: number;
  /** Plafond nominal de la dimension (barème cible). */
  max: number;
  /** Explication honnête, citant la donnée réelle (ou son absence). */
  note: string;
  /**
   * `true` si la dimension n'a PAS pu être évaluée faute de donnée : elle est
   * alors exclue de la normalisation (ni gagnée ni perdue). L'UI l'affiche en
   * « non évalué » pour rester honnête sur ce qui manque.
   */
  unavailable: boolean;
}

export type TripVerdict = 'tres-adapte' | 'adapte' | 'peu-adapte';

/** Libellés FR honnêtes du verdict (« votre sortie » = espèce + conditions du jour). */
export const TRIP_VERDICT_LABEL: Record<TripVerdict, string> = {
  'tres-adapte': 'Très adapté à votre sortie',
  adapte: 'Adapté à votre sortie',
  'peu-adapte': 'Peu adapté à votre sortie',
};

export interface TripMatchResult {
  /** Score personnalisé final 0-100 (normalisé sur les composants disponibles). */
  score: number;
  verdict: TripVerdict;
  breakdown: TripMatchFactor[];
}

/**
 * Contexte « sortie » lu depuis l'URL de la fiche (`?species=…&mode=…&lat=…&lng=…`).
 * `null` ⇒ aucun contexte sortie réel : l'appelant garde l'indice GLOBAL et
 * N'AFFICHE PAS « Adapté à votre sortie » (règle d'honnêteté).
 */
export interface TripContext {
  /** Espèce(s) ciblée(s) (`speciesId`), au minimum une. */
  species: string[];
  /** Mode de pêche éventuel (bord/bateau/float-tube…), purement informatif ici. */
  mode: string | null;
  /** Position de l'utilisateur, si partagée (sinon distance non évaluée). */
  origin: { latitude: number; longitude: number } | null;
}

function parseCoord(value: string | null, min: number, max: number): number | null {
  if (value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

/**
 * Extrait le contexte sortie depuis des query params. PUR (prend une fonction
 * d'accès `get`/`getAll` pour rester découplé de `URLSearchParams`/Next).
 *
 * Renvoie `null` SI ET SEULEMENT SI aucune espèce n'est ciblée : sans espèce, il
 * n'y a pas de « sortie » à évaluer et l'on doit retomber sur l'indice global.
 * Une position incomplète/invalide ⇒ `origin: null` (distance non évaluée), mais
 * n'empêche pas le verdict tant qu'une espèce est ciblée.
 */
export function readTripContext(params: {
  getAll: (key: string) => string[];
  get: (key: string) => string | null;
}): TripContext | null {
  const species = params.getAll('species').filter(Boolean);
  if (species.length === 0) return null;

  const lat = parseCoord(params.get('lat'), -90, 90);
  const lng = parseCoord(params.get('lng'), -180, 180);
  const origin = lat !== null && lng !== null ? { latitude: lat, longitude: lng } : null;

  const mode = params.get('mode');

  return { species, mode: mode && mode !== '' ? mode : null, origin };
}

/**
 * Entrée de sérialisation du contexte sortie vers une query string. Volontairement
 * découplée de `TripContext` (interne) : l'appelant Explorer dérive directement ses
 * filtres (`species` ids, `mode`, position) sans reconstruire un `TripContext`.
 */
export interface TripContextQueryInput {
  /** Espèce(s) ciblée(s) (`speciesId`). Vide ⇒ pas de contexte ⇒ query vide. */
  species: readonly string[];
  /** Mode de pêche éventuel (informatif). `null`/absent ⇒ param omis. */
  mode?: string | null;
  /** Position utilisateur RÉELLE (géoloc). `null`/absent ⇒ `lat`/`lng` omis. */
  origin?: { latitude: number; longitude: number } | null;
}

/**
 * Sérialise un contexte sortie en query string EXACTEMENT relisible par
 * `readTripContext` (mêmes clés : `species` répété, `mode`, `lat`, `lng`).
 *
 * SOURCE DE VÉRITÉ UNIQUE lecture↔écriture : tout changement de vocabulaire doit
 * rester aligné avec `readTripContext` (testé par round-trip). Honnêteté encodée :
 *   - Aucune espèce ⇒ chaîne VIDE (le lien reste inchangé, score global affiché).
 *   - Position absente/invalide ⇒ `lat`/`lng` OMIS (jamais une fausse position :
 *     on n'invente pas le centre de la zone Explorer). La distance ne sera alors
 *     pas évaluée (null-safe côté `computeTripMatch`).
 *
 * Renvoie une query string SANS le `?` initial (chaîne vide si pas d'espèce), prête
 * à être appendée au `href` par l'appelant.
 */
export function buildTripContextQuery(input: TripContextQueryInput): string {
  const species = input.species.filter(Boolean);
  if (species.length === 0) return '';

  const params = new URLSearchParams();
  for (const id of species) params.append('species', id);

  if (input.mode && input.mode !== '') params.set('mode', input.mode);

  const lat = input.origin?.latitude;
  const lng = input.origin?.longitude;
  // On n'émet la position QUE si les deux coordonnées sont finies et dans la même
  // plage que celle acceptée par `readTripContext` (sinon elle serait ignorée à la
  // relecture : autant ne pas l'écrire, pour rester honnête et minimal).
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {
    params.set('lat', String(lat));
    params.set('lng', String(lng));
  }

  return params.toString();
}

/** Plafonds nominaux du barème cible (somme = 100). */
const MAX = {
  species: 30,
  conditions: 20,
  activity: 20,
  distance: 15,
  regulation: 10,
  reliability: 5,
} as const;

/** Pondération de l'abondance d'une espèce sur le sous-score « espèce ». */
const ABUNDANCE_RATIO: Record<Abundance, number> = {
  VERY_HIGH: 1,
  HIGH: 0.9,
  MODERATE: 0.7,
  LOW: 0.5,
  RARE: 0.3,
};

const ABUNDANCE_LABEL: Record<Abundance, string> = {
  VERY_HIGH: 'très abondante',
  HIGH: 'abondante',
  MODERATE: 'présente',
  LOW: 'peu fréquente',
  RARE: 'rare',
};

/** Distance (m) en deçà de laquelle l'accès est jugé immédiat (plein score). */
const NEAR_METERS = 10_000; // 10 km
/** Distance (m) au-delà de laquelle le sous-score distance tombe à 0. */
const FAR_METERS = 120_000; // 120 km

const RELIABILITY_RATIO: Record<ReliabilityTier, number> = {
  high: 1,
  medium: 0.6,
  low: 0.3,
};

const RELIABILITY_LABEL: Record<ReliabilityTier, string> = {
  high: 'élevée',
  medium: 'moyenne',
  low: 'faible',
};

/** Arrondi sûr d'un ratio 0-1 vers des points sur `max`. */
function pointsFromRatio(ratio: number, max: number): number {
  const clamped = Math.max(0, Math.min(1, ratio));
  return Math.round(clamped * max);
}

/**
 * Sous-score « Espèce recherchée » /30. La meilleure correspondance entre les
 * espèces ciblées et les espèces documentées détermine le ratio (pondéré par
 * l'abondance). Aucune espèce documentée ⇒ non évalué (normalisé hors barème).
 */
function scoreSpecies(input: TripMatchInput): TripMatchFactor {
  const max = MAX.species;
  if (input.spotSpecies.length === 0) {
    return {
      label: 'Espèce recherchée',
      points: 0,
      max,
      note: 'Aucune espèce documentée sur ce spot — correspondance non évaluable.',
      unavailable: true,
    };
  }

  const targets = new Set(input.targetSpecies);
  const matches = input.spotSpecies.filter((s) => targets.has(s.speciesId));

  if (matches.length === 0) {
    return {
      label: 'Espèce recherchée',
      points: 0,
      max,
      note: 'Espèce ciblée non signalée sur ce spot.',
      unavailable: false,
    };
  }

  const best = matches.reduce((acc, s) =>
    ABUNDANCE_RATIO[s.abundance] > ABUNDANCE_RATIO[acc.abundance] ? s : acc,
  );
  const ratio = ABUNDANCE_RATIO[best.abundance];

  return {
    label: 'Espèce recherchée',
    points: pointsFromRatio(ratio, max),
    max,
    note: `Espèce ciblée ${ABUNDANCE_LABEL[best.abundance]} sur ce spot.`,
    unavailable: false,
  };
}

/**
 * Sous-score « Conditions prévues » /20, basé sur le `dynamicScore` ACTUEL
 * (conditions du jour). Libellé honnête : pas de prévision par date future.
 */
function scoreConditions(input: TripMatchInput): TripMatchFactor {
  const max = MAX.conditions;
  if (input.conditionsScore === null) {
    return {
      label: 'Conditions du jour',
      points: 0,
      max,
      note: 'Conditions du jour indisponibles pour le moment.',
      unavailable: true,
    };
  }

  const ratio = input.conditionsScore / 100;
  return {
    label: 'Conditions du jour',
    points: pointsFromRatio(ratio, max),
    max,
    note: `Conditions actuelles à ${Math.round(input.conditionsScore)}/100 (pas une prévision par date).`,
    unavailable: false,
  };
}

/**
 * Sous-score « Activité récente » /20. Souvent VIDE en prod (aucune prise
 * publique) ⇒ non évalué et normalisé hors barème. On ne fabrique aucun signal.
 */
function scoreActivity(input: TripMatchInput): TripMatchFactor {
  const max = MAX.activity;
  if (input.recentActivity.length === 0) {
    return {
      label: 'Activité récente',
      points: 0,
      max,
      note: 'Aucune prise publique récente — activité non évaluée (sans pénalité).',
      unavailable: true,
    };
  }

  const targets = new Set(input.targetSpecies);
  const targetCount = input.recentActivity
    .filter((a) => targets.has(a.speciesId))
    .reduce((sum, a) => sum + a.count, 0);
  const totalCount = input.recentActivity.reduce((sum, a) => sum + a.count, 0);

  // 5 prises ciblées récentes ⇒ plein score ; à défaut, on valorise l'activité
  // générale du spot à moitié de poids (le spot « vit », mais pas sur l'espèce).
  const targetRatio = Math.min(1, targetCount / 5);
  const generalRatio = Math.min(1, totalCount / 5) * 0.5;
  const ratio = Math.max(targetRatio, generalRatio);

  const note =
    targetCount > 0
      ? `${targetCount} prise(s) récente(s) de l'espèce ciblée.`
      : `${totalCount} prise(s) récente(s), mais aucune de l'espèce ciblée.`;

  return {
    label: 'Activité récente',
    points: pointsFromRatio(ratio, max),
    max,
    note,
    unavailable: false,
  };
}

/**
 * Sous-score « Distance & accès » /15. Distance inconnue ⇒ non évalué (normalisé
 * hors barème : on ne pénalise pas une géoloc absente). L'accès, s'il est connu,
 * module le résultat.
 */
function scoreDistance(input: TripMatchInput): TripMatchFactor {
  const max = MAX.distance;
  if (input.distanceMeters === null) {
    const accessNote =
      input.accessible === true
        ? "Distance inconnue (position non partagée) ; accès au bord praticable."
        : input.accessible === false
          ? "Distance inconnue (position non partagée) ; accès au bord limité."
          : 'Distance inconnue (position non partagée).';
    return {
      label: 'Distance & accès',
      points: 0,
      max,
      note: accessNote,
      unavailable: true,
    };
  }

  // Ratio distance : 1 en deçà de NEAR, 0 au-delà de FAR, linéaire entre.
  let distanceRatio: number;
  if (input.distanceMeters <= NEAR_METERS) distanceRatio = 1;
  else if (input.distanceMeters >= FAR_METERS) distanceRatio = 0;
  else distanceRatio = 1 - (input.distanceMeters - NEAR_METERS) / (FAR_METERS - NEAR_METERS);

  // L'accès connu module : praticable garde le plein, limité plafonne à 70 %.
  const accessFactor = input.accessible === false ? 0.7 : 1;
  const ratio = distanceRatio * accessFactor;

  const km = Math.round(input.distanceMeters / 1000);
  const accessSuffix =
    input.accessible === true
      ? ', accès au bord praticable'
      : input.accessible === false
        ? ', accès au bord limité'
        : '';
  return {
    label: 'Distance & accès',
    points: pointsFromRatio(ratio, max),
    max,
    note: `À environ ${km} km à vol d'oiseau${accessSuffix}.`,
    unavailable: false,
  };
}

/**
 * Sous-score « Réglementation » /10. Évalué dès qu'un statut réglementaire est
 * fourni (au minimum `'unknown'`). `null` ⇒ régulations NON chargées par l'appelant
 * (ex. liste Explorer, qui ne joint pas les régulations) ⇒ non évalué, hors barème.
 */
function scoreRegulation(input: TripMatchInput): TripMatchFactor {
  const max = MAX.regulation;
  if (input.regulationStatus === null) {
    return {
      label: 'Réglementation',
      points: 0,
      max,
      note: 'Réglementation non chargée ici — vérifiée sur la fiche du spot.',
      unavailable: true,
    };
  }
  const config: Record<RegulationStatus, { ratio: number; note: string }> = {
    clear: { ratio: 1, note: 'Aucune interdiction active connue.' },
    unknown: {
      ratio: 0.5,
      note: 'Réglementation locale non vérifiée — consultez la source officielle.',
    },
    restricted: {
      ratio: 0.4,
      note: 'Alerte active (pollution, crue ou sécheresse) — praticable à surveiller.',
    },
    banned: { ratio: 0, note: 'Interdiction de pêche active sur ce spot.' },
  };
  const { ratio, note } = config[input.regulationStatus];
  return {
    label: 'Réglementation',
    points: pointsFromRatio(ratio, max),
    max,
    note,
    unavailable: false,
  };
}

/**
 * Sous-score « Fiabilité des données » /5. Évalué dès qu'un palier est fourni.
 * `null` ⇒ signaux de fiabilité non disponibles pour l'appelant (ex. liste
 * Explorer) ⇒ non évalué, hors barème.
 */
function scoreReliability(input: TripMatchInput): TripMatchFactor {
  const max = MAX.reliability;
  if (input.reliability === null) {
    return {
      label: 'Fiabilité des données',
      points: 0,
      max,
      note: 'Fiabilité détaillée non chargée ici — disponible sur la fiche du spot.',
      unavailable: true,
    };
  }
  return {
    label: 'Fiabilité des données',
    points: pointsFromRatio(RELIABILITY_RATIO[input.reliability], max),
    max,
    note: `Fiabilité des informations ${RELIABILITY_LABEL[input.reliability]}.`,
    unavailable: false,
  };
}

/**
 * Dérive le `RegulationStatus` depuis les types de régulations ACTIVES du spot
 * (la fiche ne charge déjà que `regulations: { where: { isActive: true } }`).
 * Pur : prend les `type` bruts (string Prisma `RegulationType`) et applique la
 * même hiérarchie de gravité que le scoring serveur (interdiction > alerte).
 *
 * `null`/liste vide ⇒ `unknown` (et NON `clear`) : « aucune régulation chargée »
 * ne vaut pas « autorisé » — règle d'honnêteté réglementaire.
 */
export function deriveRegulationStatus(
  activeRegulationTypes: readonly string[] | null,
): RegulationStatus {
  if (activeRegulationTypes === null) return 'unknown';
  if (activeRegulationTypes.length === 0) return 'clear';

  const has = (t: string) => activeRegulationTypes.includes(t);
  if (has('PERMANENT_BAN') || has('SEASONAL_BAN')) return 'banned';
  if (has('POLLUTION_ALERT') || has('FLOOD_ALERT') || has('DROUGHT_ALERT')) {
    return 'restricted';
  }
  return 'clear';
}

/** Mappe un score 0-100 vers un verdict FR honnête. */
function deriveVerdict(score: number): TripVerdict {
  if (score >= 70) return 'tres-adapte';
  if (score >= 45) return 'adapte';
  return 'peu-adapte';
}

/**
 * Calcule le score personnalisé « Adapté à votre sortie ».
 *
 * Normalisation : on additionne les points et les plafonds des SEULES dimensions
 * réellement évaluables (`unavailable === false`), puis on rapporte sur 100. Une
 * dimension non évaluable n'est ni gagnée ni perdue — elle disparaît du
 * dénominateur, ce qui évite de punir un spot pour une donnée absente.
 */
export function computeTripMatch(input: TripMatchInput): TripMatchResult {
  const breakdown: TripMatchFactor[] = [
    scoreSpecies(input),
    scoreConditions(input),
    scoreActivity(input),
    scoreDistance(input),
    scoreRegulation(input),
    scoreReliability(input),
  ];

  const evaluable = breakdown.filter((f) => !f.unavailable);
  const earned = evaluable.reduce((sum, f) => sum + f.points, 0);
  const possible = evaluable.reduce((sum, f) => sum + f.max, 0);

  // Garde-fou : si AUCUNE dimension n'est évaluable (cas théorique extrême),
  // le score est 0 mais le verdict reste le plus prudent.
  const score = possible > 0 ? Math.round((earned / possible) * 100) : 0;

  return { score, verdict: deriveVerdict(score), breakdown };
}

/**
 * Données d'UN spot de liste réellement disponibles pour le verdict « sortie »
 * (sous-ensemble honnête de `SpotListItem`). Volontairement minimal : la liste
 * Explorer ne joint PAS les régulations, les signaux de fiabilité, ni le
 * `dynamicScore` du jour — elle ne porte donc PAS ces dimensions (cf. écart liste↔fiche).
 */
export interface TripMatchListItem {
  latitude: number;
  longitude: number;
  /**
   * Espèces documentées sur ce spot (jointure légère `speciesId`+`abundance`,
   * ajoutée au `spotListSelect`). Absente ⇒ correspondance espèce non évaluée.
   */
  species?: readonly TripMatchSpecies[] | null;
  /**
   * Accès au bord praticable, dérivé de `accessibility` (parking || boatLaunch).
   * `null` ⇒ inconnu (n'entre pas dans le sous-score, sans pénalité).
   */
  accessible: boolean | null;
}

/**
 * Contexte « sortie » minimal nécessaire au verdict PAR ITEM côté liste : espèce(s)
 * ciblée(s) et position utilisateur réelle (si partagée). Dérivé de `TripContext`
 * mais découplé (la liste l'alimente directement depuis ses filtres).
 */
export interface TripMatchListContext {
  /** Espèce(s) ciblée(s) (`speciesId`). Vide ⇒ pas de sortie ⇒ pas de verdict. */
  targetSpecies: readonly string[];
  /** Position utilisateur RÉELLE (géoloc « Autour de moi »). `null` ⇒ distance non évaluée. */
  origin: { latitude: number; longitude: number } | null;
}

/**
 * Dérive le verdict « Adapté à votre sortie » pour UN item de liste, à partir des
 * SEULES données réellement disponibles par item (espèce + distance & accès). Vue
 * COHÉRENTE du même barème/seuils que la fiche, mais volontairement partielle :
 *
 *   - Conditions du jour : `null` ici. La liste n'a que le `fishabilityScore` GLOBAL,
 *     qui n'est PAS le `dynamicScore` du jour utilisé par la fiche — les mélanger
 *     fausserait l'échelle. On exclut donc la dimension (hors barème) plutôt que de
 *     fabriquer un proxy malhonnête.
 *   - Activité récente : `[]` (aucune prise publique en prod, comme la fiche).
 *   - Réglementation / Fiabilité : `null` (non jointes en liste pour rester légère).
 *
 * Conséquence assumée : le badge liste et le verdict fiche peuvent légèrement
 * différer (la fiche a plus de dimensions évaluables). C'est cohérent — même échelle,
 * mêmes seuils — et documenté. Retourne `null` SI aucune espèce n'est ciblée
 * (honnêteté : pas de « sortie » à évaluer ⇒ l'appelant n'affiche aucun badge verdict).
 */
export function deriveListItemTripMatch(
  item: TripMatchListItem,
  context: TripMatchListContext,
): TripMatchResult | null {
  if (context.targetSpecies.length === 0) return null;

  const distanceMeters = context.origin
    ? haversineMeters(context.origin, { latitude: item.latitude, longitude: item.longitude })
    : null;

  return computeTripMatch({
    targetSpecies: context.targetSpecies,
    spotSpecies: item.species ?? [],
    conditionsScore: null,
    distanceMeters,
    accessible: item.accessible,
    regulationStatus: null,
    reliability: null,
    recentActivity: [],
  });
}
