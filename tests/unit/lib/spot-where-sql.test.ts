import { describe, it, expect } from 'vitest';
import { buildSpotFilterSql } from '@/lib/spot-where-sql';

/**
 * `buildSpotFilterSql` est la source SQL UNIQUE des chemins PostGIS (tuiles MVT + bbox).
 * Sa sémantique doit rester ALIGNÉE sur `buildSpotWhere` (liste). On ne reconstruit pas
 * ici tout le SQL : on vérifie qu'à un jeu de filtres donné correspond le bon NOMBRE de
 * fragments et que les valeurs paramétrées attendues y figurent (placeholders Prisma,
 * donc aucune valeur n'est interpolée en clair — protection anti-injection).
 *
 * Helper : on lit les valeurs paramétrées agrégées de tous les fragments.
 */
function values(searchParams: URLSearchParams): unknown[] {
  return buildSpotFilterSql(searchParams).flatMap((sql) => sql.values);
}

describe('buildSpotFilterSql', () => {
  it('params vides → aucun fragment', () => {
    expect(buildSpotFilterSql(new URLSearchParams())).toEqual([]);
  });

  it('ignore les valeurs arbitraires de mode/technique (filtrage défensif partagé)', () => {
    const params = new URLSearchParams();
    params.append('fishingMode', 'NOPE');
    params.append('fishingTechnique', 'ALSO_NOPE');
    expect(buildSpotFilterSql(params)).toEqual([]);
  });

  it('premiumOnly=true → un fragment isPremium', () => {
    const fragments = buildSpotFilterSql(new URLSearchParams({ premiumOnly: 'true' }));
    expect(fragments).toHaveLength(1);
    expect(fragments[0].sql).toContain('isPremium');
  });

  it('origin=USER (masquer auto-découverts) → fragment dataOrigin paramétré à USER', () => {
    const params = new URLSearchParams({ origin: 'USER' });
    const fragments = buildSpotFilterSql(params);
    expect(fragments).toHaveLength(1);
    expect(fragments[0].sql).toContain('dataOrigin');
    expect(values(params)).toContain('USER');
  });

  it('premium + masquage auto-découverts → deux fragments cumulés', () => {
    const params = new URLSearchParams({ premiumOnly: 'true', origin: 'USER' });
    expect(buildSpotFilterSql(params)).toHaveLength(2);
  });

  it('département + score min → deux fragments avec les valeurs paramétrées', () => {
    const params = new URLSearchParams({ department: '74', minFishabilityScore: '60' });
    const fragments = buildSpotFilterSql(params);
    expect(fragments).toHaveLength(2);
    const v = values(params);
    expect(v).toContain('74');
    expect(v).toContain(60);
  });

  it('FREE inclut accessType NULL (parité avec buildSpotWhere)', () => {
    const fragments = buildSpotFilterSql(new URLSearchParams({ accessType: 'FREE' }));
    expect(fragments).toHaveLength(1);
    expect(fragments[0].sql).toContain('IS NULL');
  });

  it('mode + technique → deux fragments d’intersection distincts sur fishingTypes', () => {
    const params = new URLSearchParams();
    params.append('fishingMode', 'SHORE');
    params.append('fishingTechnique', 'SPINNING');
    const fragments = buildSpotFilterSql(params);
    expect(fragments).toHaveLength(2);
    expect(fragments.every((f) => f.sql.includes('fishingTypes'))).toBe(true);
  });
});
