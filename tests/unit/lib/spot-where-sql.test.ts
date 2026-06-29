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
  // NB modèle 3 niveaux : un fragment `kind` (défaut WATER_BODY) est TOUJOURS ajouté
  // en dernier — les comptes ci-dessous l'incluent, et `fragments[0]` reste le 1er
  // filtre « métier » puisque `kind` est poussé après tous les autres.
  it('params vides → fragment kind par défaut (WATER_BODY) uniquement', () => {
    const fragments = buildSpotFilterSql(new URLSearchParams());
    expect(fragments).toHaveLength(1);
    expect(fragments[0].sql).toContain('"kind"');
    expect(values(new URLSearchParams())).toContain('WATER_BODY');
  });

  it('ignore les valeurs arbitraires de mode/technique → seul le fragment kind par défaut', () => {
    const params = new URLSearchParams();
    params.append('fishingMode', 'NOPE');
    params.append('fishingTechnique', 'ALSO_NOPE');
    const fragments = buildSpotFilterSql(params);
    expect(fragments).toHaveLength(1);
    expect(fragments[0].sql).toContain('"kind"');
  });

  it('premiumOnly=true → fragment isPremium (+ kind par défaut)', () => {
    const fragments = buildSpotFilterSql(new URLSearchParams({ premiumOnly: 'true' }));
    expect(fragments).toHaveLength(2);
    expect(fragments[0].sql).toContain('isPremium');
  });

  it('origin=USER (masquer auto-découverts) → fragment dataOrigin paramétré à USER (+ kind)', () => {
    const params = new URLSearchParams({ origin: 'USER' });
    const fragments = buildSpotFilterSql(params);
    expect(fragments).toHaveLength(2);
    expect(fragments[0].sql).toContain('dataOrigin');
    expect(values(params)).toContain('USER');
  });

  it('premium + masquage auto-découverts → deux fragments cumulés (+ kind)', () => {
    const params = new URLSearchParams({ premiumOnly: 'true', origin: 'USER' });
    expect(buildSpotFilterSql(params)).toHaveLength(3);
  });

  it('département + score min → deux fragments avec les valeurs paramétrées (+ kind)', () => {
    const params = new URLSearchParams({ department: '74', minFishabilityScore: '60' });
    const fragments = buildSpotFilterSql(params);
    expect(fragments).toHaveLength(3);
    const v = values(params);
    expect(v).toContain('74');
    expect(v).toContain(60);
  });

  it('FREE inclut accessType NULL (parité avec buildSpotWhere) (+ kind)', () => {
    const fragments = buildSpotFilterSql(new URLSearchParams({ accessType: 'FREE' }));
    expect(fragments).toHaveLength(2);
    expect(fragments[0].sql).toContain('IS NULL');
  });

  it('mode + technique → deux fragments d’intersection distincts sur fishingTypes (+ kind)', () => {
    const params = new URLSearchParams();
    params.append('fishingMode', 'SHORE');
    params.append('fishingTechnique', 'SPINNING');
    const fragments = buildSpotFilterSql(params);
    expect(fragments).toHaveLength(3);
    expect(fragments.filter((f) => f.sql.includes('fishingTypes'))).toHaveLength(2);
  });

  // ── Modèle 3 niveaux : défaut WATER_BODY + override explicite ──
  it('kind=ACCESS_ZONE → remplace le défaut (un seul fragment kind, valeur ACCESS_ZONE)', () => {
    const params = new URLSearchParams({ kind: 'ACCESS_ZONE' });
    const fragments = buildSpotFilterSql(params);
    expect(fragments).toHaveLength(1);
    expect(fragments[0].sql).toContain('"kind"');
    expect(values(params)).toContain('ACCESS_ZONE');
    expect(values(params)).not.toContain('WATER_BODY');
  });

  it('kind multivalué → un fragment IN couvrant les deux niveaux', () => {
    const params = new URLSearchParams();
    params.append('kind', 'WATER_BODY');
    params.append('kind', 'ACCESS_ZONE');
    const fragments = buildSpotFilterSql(params);
    expect(fragments).toHaveLength(1);
    const v = values(params);
    expect(v).toContain('WATER_BODY');
    expect(v).toContain('ACCESS_ZONE');
  });

  it('valeur kind arbitraire écartée au parsing → retombe sur le défaut WATER_BODY', () => {
    const params = new URLSearchParams({ kind: 'NOPE' });
    const v = values(params);
    expect(v).toContain('WATER_BODY');
    expect(v).not.toContain('NOPE');
  });
});
