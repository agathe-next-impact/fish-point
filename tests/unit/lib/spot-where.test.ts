import { describe, it, expect } from 'vitest';
import { buildSpotWhere } from '@/lib/spot-where';
import type { SpotQueryFilters } from '@/lib/spot-filter-params';

/**
 * Garde-fou d'équivalence iso-fonctionnelle : ce test fige la forme du `where`
 * Prisma produit par `buildSpotWhere`, qui doit rester identique au bloc inline
 * historiquement présent dans `/api/spots/route.ts` (convergence filtres, sous-étape 2).
 * Note : `buildSpotWhere` ne produit PAS la base `status: 'APPROVED'` ni les bornes géo
 * (north/south/east/west, lat/lng/radius) — celles-ci restent fusionnées dans le route handler.
 */

describe('buildSpotWhere', () => {
  it('filtres vides → défaut WATER_BODY seul (pas de AND, pas de clés parasites)', () => {
    expect(buildSpotWhere({})).toEqual({ kind: { in: ['WATER_BODY'] } });
  });

  it('listes vides explicites → ignorées (gardes length > 0), défaut WATER_BODY seul', () => {
    const filters: SpotQueryFilters = {
      kind: [],
      waterType: [],
      fishCategory: [],
      species: [],
      fishingMode: [],
      fishingTechnique: [],
    };
    expect(buildSpotWhere(filters)).toEqual({ kind: { in: ['WATER_BODY'] } });
  });

  // ── Modèle 3 niveaux : défaut WATER_BODY + override explicite ──
  it('kind absent → défaut WATER_BODY (clé scalaire de premier niveau, hors AND)', () => {
    const where = buildSpotWhere({ department: '74' });
    expect(where.kind).toEqual({ in: ['WATER_BODY'] });
    expect(where.AND).toBeUndefined();
  });

  it('kind explicite ACCESS_ZONE → remplace le défaut (pas de cumul)', () => {
    expect(buildSpotWhere({ kind: ['ACCESS_ZONE'] }).kind).toEqual({ in: ['ACCESS_ZONE'] });
  });

  it('kind explicite des deux niveaux → in [WATER_BODY, ACCESS_ZONE]', () => {
    expect(buildSpotWhere({ kind: ['WATER_BODY', 'ACCESS_ZONE'] }).kind).toEqual({
      in: ['WATER_BODY', 'ACCESS_ZONE'],
    });
  });

  it('clés de premier niveau scalaires (department, waterType, waterCategory)', () => {
    const where = buildSpotWhere({
      department: '74',
      waterType: ['LAKE', 'RIVER'],
      waterCategory: 'FIRST',
    });
    expect(where.department).toBe('74');
    expect(where.waterType).toEqual({ in: ['LAKE', 'RIVER'] });
    expect(where.waterCategory).toBe('FIRST');
    expect(where.AND).toBeUndefined();
  });

  it('search → OR insensible à la casse sur name + commune (clé de premier niveau)', () => {
    const where = buildSpotWhere({ search: 'annecy' });
    expect(where.OR).toEqual([
      { name: { contains: 'annecy', mode: 'insensitive' } },
      { commune: { contains: 'annecy', mode: 'insensitive' } },
    ]);
  });

  it('accessType FREE → OR [accessType FREE, accessType null] dans AND (libre inclut le défaut)', () => {
    const where = buildSpotWhere({ accessType: 'FREE' });
    expect(where.accessType).toBeUndefined();
    expect(where.AND).toEqual([{ OR: [{ accessType: 'FREE' }, { accessType: null }] }]);
  });

  it('accessType non-FREE → clé accessType de premier niveau (pas de AND)', () => {
    const where = buildSpotWhere({ accessType: 'PAID' });
    expect(where.accessType).toBe('PAID');
    expect(where.AND).toBeUndefined();
  });

  it('fishCategory → species.some.species.category.in (clé de premier niveau)', () => {
    const where = buildSpotWhere({ fishCategory: ['CARNIVORE', 'CYPRINIDAE'] });
    expect(where.species).toEqual({
      some: { species: { category: { in: ['CARNIVORE', 'CYPRINIDAE'] } } },
    });
  });

  it('species (ids) → AND species.some.speciesId.in (ne pas écraser fishCategory)', () => {
    const where = buildSpotWhere({ species: ['esox-1', 'sander-2'] });
    expect(where.AND).toEqual([
      { species: { some: { speciesId: { in: ['esox-1', 'sander-2'] } } } },
    ]);
  });

  it('fishCategory + species coexistent (premier niveau + AND, pas d’écrasement)', () => {
    const where = buildSpotWhere({
      fishCategory: ['CARNIVORE'],
      species: ['esox-1'],
    });
    expect(where.species).toEqual({
      some: { species: { category: { in: ['CARNIVORE'] } } },
    });
    expect(where.AND).toEqual([
      { species: { some: { speciesId: { in: ['esox-1'] } } } },
    ]);
  });

  it('mode + technique → deux fishingTypes.hasSome distincts dans AND (intersection)', () => {
    const where = buildSpotWhere({
      fishingMode: ['SHORE', 'BOAT'],
      fishingTechnique: ['SPINNING', 'FLY'],
    });
    expect(where.AND).toEqual([
      { fishingTypes: { hasSome: ['SHORE', 'BOAT'] } },
      { fishingTypes: { hasSome: ['SPINNING', 'FLY'] } },
    ]);
  });

  it('mode/technique : valeurs inconnues écartées (filtrage défensif via splitFishingTypes)', () => {
    const where = buildSpotWhere({
      fishingMode: ['SHORE', 'NOPE'],
      fishingTechnique: ['FLY', 'SHORE'], // SHORE est un mode, pas une technique
    });
    expect(where.AND).toEqual([
      { fishingTypes: { hasSome: ['SHORE'] } },
      { fishingTypes: { hasSome: ['FLY'] } },
    ]);
  });

  it('accessibilité → un AND accessibility.path/equals par flag actif, ordre stable', () => {
    const where = buildSpotWhere({ parking: true, boatLaunch: false, pmr: true });
    expect(where.AND).toEqual([
      { accessibility: { path: ['parking'], equals: true } },
      { accessibility: { path: ['pmr'], equals: true } },
    ]);
  });

  it('minRating > 0 → averageRating.gte (premier niveau) ; 0 → ignoré', () => {
    expect(buildSpotWhere({ minRating: 3.5 }).averageRating).toEqual({ gte: 3.5 });
    expect(buildSpotWhere({ minRating: 0 }).averageRating).toBeUndefined();
  });

  it('bornes de score : min seul, max seul, et les deux', () => {
    expect(buildSpotWhere({ minFishabilityScore: 60 }).fishabilityScore).toEqual({ gte: 60 });
    expect(buildSpotWhere({ maxFishabilityScore: 90 }).fishabilityScore).toEqual({ lte: 90 });
    expect(
      buildSpotWhere({ minFishabilityScore: 60, maxFishabilityScore: 90 }).fishabilityScore,
    ).toEqual({ gte: 60, lte: 90 });
  });

  it('score à 0 → pas de contrainte fishabilityScore', () => {
    expect(
      buildSpotWhere({ minFishabilityScore: 0, maxFishabilityScore: 0 }).fishabilityScore,
    ).toBeUndefined();
  });

  // ── Filtres « affichage » (parité liste/carte, sous-étape 5) ──
  it('premiumOnly true → isPremium true (premier niveau) ; absent/false → ignoré', () => {
    expect(buildSpotWhere({ premiumOnly: true }).isPremium).toBe(true);
    expect(buildSpotWhere({ premiumOnly: false }).isPremium).toBeUndefined();
    expect(buildSpotWhere({}).isPremium).toBeUndefined();
  });

  it('showAutoDiscovered false → dataOrigin USER ; true/absent → pas de contrainte', () => {
    expect(buildSpotWhere({ showAutoDiscovered: false }).dataOrigin).toBe('USER');
    expect(buildSpotWhere({ showAutoDiscovered: true }).dataOrigin).toBeUndefined();
    expect(buildSpotWhere({}).dataOrigin).toBeUndefined();
  });

  it('premium + masquage auto-découverts cumulés (deux clés scalaires, pas de AND)', () => {
    const where = buildSpotWhere({ premiumOnly: true, showAutoDiscovered: false });
    expect(where.isPremium).toBe(true);
    expect(where.dataOrigin).toBe('USER');
    expect(where.AND).toBeUndefined();
  });

  it('jeu complet : clés de premier niveau + AND ordonné (FREE, species, mode, technique, accès)', () => {
    const filters: SpotQueryFilters = {
      department: '74',
      waterType: ['LAKE'],
      waterCategory: 'FIRST',
      fishCategory: ['CARNIVORE'],
      accessType: 'FREE',
      search: 'lac',
      minRating: 3,
      minFishabilityScore: 50,
      maxFishabilityScore: 90,
      species: ['esox-1'],
      fishingMode: ['SHORE'],
      fishingTechnique: ['SPINNING'],
      parking: true,
      boatLaunch: true,
      pmr: true,
      nightFishing: true,
    };
    expect(buildSpotWhere(filters)).toEqual({
      kind: { in: ['WATER_BODY'] },
      department: '74',
      waterType: { in: ['LAKE'] },
      waterCategory: 'FIRST',
      species: { some: { species: { category: { in: ['CARNIVORE'] } } } },
      OR: [
        { name: { contains: 'lac', mode: 'insensitive' } },
        { commune: { contains: 'lac', mode: 'insensitive' } },
      ],
      averageRating: { gte: 3 },
      fishabilityScore: { gte: 50, lte: 90 },
      AND: [
        { OR: [{ accessType: 'FREE' }, { accessType: null }] },
        { species: { some: { speciesId: { in: ['esox-1'] } } } },
        { fishingTypes: { hasSome: ['SHORE'] } },
        { fishingTypes: { hasSome: ['SPINNING'] } },
        { accessibility: { path: ['parking'], equals: true } },
        { accessibility: { path: ['boatLaunch'], equals: true } },
        { accessibility: { path: ['pmr'], equals: true } },
        { accessibility: { path: ['nightFishing'], equals: true } },
      ],
    });
  });
});
