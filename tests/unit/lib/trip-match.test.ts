import { describe, it, expect } from 'vitest';
import {
  computeTripMatch,
  deriveRegulationStatus,
  readTripContext,
  type TripMatchInput,
  type TripMatchFactor,
} from '@/lib/trip-match';

/** Contexte sortie « idéal » : espèce ciblée abondante, conditions bonnes, proche. */
const baseInput: TripMatchInput = {
  targetSpecies: ['pike'],
  spotSpecies: [{ speciesId: 'pike', abundance: 'HIGH' }],
  conditionsScore: 80,
  distanceMeters: 5_000,
  accessible: true,
  regulationStatus: 'clear',
  reliability: 'high',
  recentActivity: [],
};

function factor(result: ReturnType<typeof computeTripMatch>, label: string): TripMatchFactor {
  const f = result.breakdown.find((b) => b.label === label);
  if (!f) throw new Error(`Facteur introuvable : ${label}`);
  return f;
}

describe('computeTripMatch — verdict global', () => {
  it('renvoie « très adapté » pour une sortie idéale', () => {
    const r = computeTripMatch(baseInput);
    expect(r.verdict).toBe('tres-adapte');
    expect(r.score).toBeGreaterThanOrEqual(70);
    expect(r.breakdown).toHaveLength(6);
  });

  it('renvoie « peu adapté » quand l’espèce ciblée est absente et tout est défavorable', () => {
    const r = computeTripMatch({
      ...baseInput,
      spotSpecies: [{ speciesId: 'roach', abundance: 'LOW' }],
      conditionsScore: 10,
      distanceMeters: 110_000,
      accessible: false,
      regulationStatus: 'restricted',
      reliability: 'low',
    });
    expect(r.verdict).toBe('peu-adapte');
    expect(r.score).toBeLessThan(45);
  });

  it('plafonne le score à 100 et le plancher à 0', () => {
    const r = computeTripMatch(baseInput);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.score).toBeGreaterThanOrEqual(0);
  });
});

describe('computeTripMatch — sous-score espèce /30', () => {
  it('valorise davantage une espèce très abondante qu’une espèce rare', () => {
    const rich = computeTripMatch(baseInput);
    const rare = computeTripMatch({
      ...baseInput,
      spotSpecies: [{ speciesId: 'pike', abundance: 'RARE' }],
    });
    expect(factor(rich, 'Espèce recherchée').points).toBeGreaterThan(
      factor(rare, 'Espèce recherchée').points,
    );
  });

  it('retient la MEILLEURE correspondance parmi plusieurs espèces ciblées', () => {
    const r = computeTripMatch({
      ...baseInput,
      targetSpecies: ['pike', 'zander'],
      spotSpecies: [
        { speciesId: 'pike', abundance: 'RARE' },
        { speciesId: 'zander', abundance: 'VERY_HIGH' },
      ],
    });
    expect(factor(r, 'Espèce recherchée').points).toBe(30);
  });

  it('attribue 0 (mais évalué) quand l’espèce ciblée n’est pas signalée', () => {
    const r = computeTripMatch({
      ...baseInput,
      spotSpecies: [{ speciesId: 'roach', abundance: 'HIGH' }],
    });
    const f = factor(r, 'Espèce recherchée');
    expect(f.points).toBe(0);
    expect(f.unavailable).toBe(false);
  });

  it('marque l’espèce « non évaluée » quand le spot n’a aucune espèce documentée', () => {
    const r = computeTripMatch({ ...baseInput, spotSpecies: [] });
    expect(factor(r, 'Espèce recherchée').unavailable).toBe(true);
  });
});

describe('computeTripMatch — normalisation null-safe (honnêteté)', () => {
  it('exclut une dimension indisponible du dénominateur (pas de 0 dur)', () => {
    // Conditions indisponibles : le score ne doit PAS chuter mécaniquement,
    // il est normalisé sur les dimensions restantes.
    const withConditions = computeTripMatch(baseInput);
    const withoutConditions = computeTripMatch({ ...baseInput, conditionsScore: null });
    expect(factor(withoutConditions, 'Conditions du jour').unavailable).toBe(true);
    // Sans le facteur conditions (80/100 ⇒ 16/20, soit en dessous du plein),
    // retirer cette dimension ne fait pas baisser le score.
    expect(withoutConditions.score).toBeGreaterThanOrEqual(withConditions.score);
  });

  it('n’évalue pas la distance quand la position utilisateur est inconnue', () => {
    const r = computeTripMatch({ ...baseInput, distanceMeters: null, accessible: null });
    expect(factor(r, 'Distance & accès').unavailable).toBe(true);
    // Une géoloc absente ne doit pas rendre la sortie « peu adaptée ».
    expect(r.verdict).toBe('tres-adapte');
  });

  it('ne pénalise pas l’absence de prises publiques (activité non évaluée)', () => {
    const r = computeTripMatch(baseInput); // recentActivity vide
    const f = factor(r, 'Activité récente');
    expect(f.unavailable).toBe(true);
    expect(f.note).toContain('sans pénalité');
  });

  it('reste calculable même si toutes les dimensions optionnelles manquent', () => {
    const r = computeTripMatch({
      ...baseInput,
      spotSpecies: [],
      conditionsScore: null,
      distanceMeters: null,
      accessible: null,
      recentActivity: [],
    });
    // Restent évaluables : réglementation /10 + fiabilité /5.
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    const evaluable = r.breakdown.filter((f) => !f.unavailable);
    expect(evaluable.map((f) => f.label).sort()).toEqual([
      'Fiabilité des données',
      'Réglementation',
    ]);
  });
});

describe('computeTripMatch — activité récente', () => {
  it('valorise les prises récentes de l’espèce ciblée', () => {
    const r = computeTripMatch({
      ...baseInput,
      recentActivity: [{ speciesId: 'pike', count: 5 }],
    });
    const f = factor(r, 'Activité récente');
    expect(f.unavailable).toBe(false);
    expect(f.points).toBe(20);
    expect(f.note).toContain('espèce ciblée');
  });

  it('valorise à moitié l’activité générale quand l’espèce ciblée n’y figure pas', () => {
    const r = computeTripMatch({
      ...baseInput,
      recentActivity: [{ speciesId: 'roach', count: 10 }],
    });
    const f = factor(r, 'Activité récente');
    expect(f.points).toBe(10); // 0,5 × 20
    expect(f.note).toContain('aucune de l');
  });
});

describe('computeTripMatch — réglementation /10', () => {
  it('annule la réglementation sur une interdiction active', () => {
    const r = computeTripMatch({ ...baseInput, regulationStatus: 'banned' });
    expect(factor(r, 'Réglementation').points).toBe(0);
  });

  it('reste prudent (mi-points) quand la réglementation n’est pas vérifiée', () => {
    const r = computeTripMatch({ ...baseInput, regulationStatus: 'unknown' });
    const f = factor(r, 'Réglementation');
    expect(f.points).toBe(5);
    expect(f.note).toContain('non vérifiée');
  });
});

describe('computeTripMatch — distance & accès /15', () => {
  it('donne le plein score à proximité immédiate', () => {
    const r = computeTripMatch({ ...baseInput, distanceMeters: 3_000 });
    expect(factor(r, 'Distance & accès').points).toBe(15);
  });

  it('tombe à 0 au-delà de la portée maximale', () => {
    const r = computeTripMatch({ ...baseInput, distanceMeters: 200_000 });
    expect(factor(r, 'Distance & accès').points).toBe(0);
  });

  it('plafonne quand l’accès au bord est limité', () => {
    const open = computeTripMatch({ ...baseInput, distanceMeters: 3_000, accessible: true });
    const limited = computeTripMatch({ ...baseInput, distanceMeters: 3_000, accessible: false });
    expect(limited.breakdown.find((f) => f.label === 'Distance & accès')!.points).toBeLessThan(
      open.breakdown.find((f) => f.label === 'Distance & accès')!.points,
    );
  });
});

describe('deriveRegulationStatus', () => {
  it('renvoie « unknown » quand les régulations ne sont pas chargées (null)', () => {
    expect(deriveRegulationStatus(null)).toBe('unknown');
  });

  it('renvoie « clear » quand aucune régulation active', () => {
    expect(deriveRegulationStatus([])).toBe('clear');
  });

  it('renvoie « banned » sur une interdiction permanente ou saisonnière', () => {
    expect(deriveRegulationStatus(['PERMANENT_BAN'])).toBe('banned');
    expect(deriveRegulationStatus(['SEASONAL_BAN'])).toBe('banned');
  });

  it('renvoie « restricted » sur une alerte (pollution/crue/sécheresse)', () => {
    expect(deriveRegulationStatus(['POLLUTION_ALERT'])).toBe('restricted');
    expect(deriveRegulationStatus(['DROUGHT_ALERT'])).toBe('restricted');
  });

  it('priorise l’interdiction sur l’alerte', () => {
    expect(deriveRegulationStatus(['DROUGHT_ALERT', 'PERMANENT_BAN'])).toBe('banned');
  });
});

describe('readTripContext', () => {
  function paramsFrom(query: string) {
    const sp = new URLSearchParams(query);
    return { getAll: (k: string) => sp.getAll(k), get: (k: string) => sp.get(k) };
  }

  it('renvoie null sans espèce ciblée (pas de contexte sortie)', () => {
    expect(readTripContext(paramsFrom('mode=bord&lat=45&lng=5'))).toBeNull();
    expect(readTripContext(paramsFrom(''))).toBeNull();
  });

  it('lit une espèce et une position valides', () => {
    const ctx = readTripContext(paramsFrom('species=pike&mode=bord&lat=45.5&lng=5.2'));
    expect(ctx).not.toBeNull();
    expect(ctx!.species).toEqual(['pike']);
    expect(ctx!.mode).toBe('bord');
    expect(ctx!.origin).toEqual({ latitude: 45.5, longitude: 5.2 });
  });

  it('accepte plusieurs espèces', () => {
    const ctx = readTripContext(paramsFrom('species=pike&species=zander'));
    expect(ctx!.species).toEqual(['pike', 'zander']);
  });

  it('ignore une position incomplète ou hors plage (origin null, verdict possible)', () => {
    expect(readTripContext(paramsFrom('species=pike&lat=45'))!.origin).toBeNull();
    expect(readTripContext(paramsFrom('species=pike&lat=999&lng=5'))!.origin).toBeNull();
  });
});
