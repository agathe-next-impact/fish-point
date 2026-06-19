import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  parseSpotFilterParams,
  splitFishingTypes,
  activeAccessibilityFlags,
} from '@/lib/spot-filter-params';

interface TileParams {
  z: string;
  x: string;
  y: string;
}

interface MvtRow {
  mvt: Uint8Array | Buffer | null;
}

function parseTileParam(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  return Number(value);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<TileParams> },
) {
  try {
    const { z: zParam, x: xParam, y: yParam } = await params;
    const z = parseTileParam(zParam);
    const x = parseTileParam(xParam);
    const yWithExtension = yParam.replace(/\.mvt$/, '');
    const y = parseTileParam(yWithExtension);

    if (z == null || x == null || y == null || z < 0 || z > 16) {
      return NextResponse.json({ error: 'Invalid tile coordinates' }, { status: 400 });
    }

    const max = 2 ** z;
    if (x < 0 || x >= max || y < 0 || y >= max) {
      return NextResponse.json({ error: 'Tile out of range' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);

    // Vocabulaire de filtres PARTAGÉ avec /api/spots (liste). `parseSpotFilterParams`
    // est la source unique : la carte (tuiles) et la liste appliquent désormais
    // exactement les mêmes filtres « sortie » (espèce, mode/technique, accès…).
    const shared = parseSpotFilterParams(searchParams);
    const { modes, techniques } = splitFishingTypes(shared);

    // Filtres exclusifs carte, désormais émis par le contrôle UNIQUE `FilterRail` via le
    // helper partagé `serializeSpotFilters` (sous-étape 4) : `origin=USER` (exclure les
    // auto-découverts) et `premiumOnly=true`. L'alias legacy `fishingType` (singulier, sans
    // distinction mode/technique) n'est plus émis ; toléré ici par robustesse (vieux liens).
    const origin = searchParams.get('origin');
    const premiumOnly = searchParams.get('premiumOnly') === 'true';
    const legacyFishingTypes = searchParams.getAll('fishingType').filter(Boolean);

    const filters: Prisma.Sql[] = [];

    if (shared.waterType && shared.waterType.length > 0) {
      filters.push(Prisma.sql`s."waterType"::text IN (${Prisma.join(shared.waterType)})`);
    }
    if (shared.waterCategory) {
      filters.push(Prisma.sql`s."waterCategory"::text = ${shared.waterCategory}`);
    }
    if (shared.search) {
      const like = `%${shared.search}%`;
      filters.push(Prisma.sql`(s."name" ILIKE ${like} OR s."commune" ILIKE ${like})`);
    }
    if (shared.department) {
      filters.push(Prisma.sql`s."department" = ${shared.department}`);
    }

    // Accès au droit de pêche (FREE inclut les spots sans accessType, cf. /api/spots).
    if (shared.accessType) {
      if (shared.accessType === 'FREE') {
        filters.push(Prisma.sql`(s."accessType" = 'FREE'::"AccessType" OR s."accessType" IS NULL)`);
      } else {
        filters.push(Prisma.sql`s."accessType"::text = ${shared.accessType}`);
      }
    }

    // Espèce précise (relation SpotSpecies par id) et catégorie de poisson (par enum).
    if (shared.species && shared.species.length > 0) {
      filters.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "spot_species" ss
        WHERE ss."spotId" = s."id" AND ss."speciesId" IN (${Prisma.join(shared.species)})
      )`);
    }
    if (shared.fishCategory && shared.fishCategory.length > 0) {
      filters.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "spot_species" ss
        JOIN "fish_species" fs ON fs."id" = ss."speciesId"
        WHERE ss."spotId" = s."id" AND fs."category"::text IN (${Prisma.join(shared.fishCategory)})
      )`);
    }

    // Mode + technique = même colonne `fishingTypes` (array enum) : intersection des deux
    // intentions, exactement comme /api/spots. Alias legacy `fishingType` traité à part.
    if (modes.length > 0) {
      filters.push(Prisma.sql`s."fishingTypes"::text[] && ARRAY[${Prisma.join(modes)}]::text[]`);
    }
    if (techniques.length > 0) {
      filters.push(Prisma.sql`s."fishingTypes"::text[] && ARRAY[${Prisma.join(techniques)}]::text[]`);
    }
    if (legacyFishingTypes.length > 0) {
      filters.push(
        Prisma.sql`s."fishingTypes"::text[] && ARRAY[${Prisma.join(legacyFishingTypes)}]::text[]`,
      );
    }

    if (shared.minRating != null && shared.minRating > 0) {
      filters.push(Prisma.sql`s."averageRating" >= ${shared.minRating}`);
    }
    if (shared.minFishabilityScore != null && shared.minFishabilityScore > 0) {
      filters.push(Prisma.sql`s."fishabilityScore" >= ${shared.minFishabilityScore}`);
    }
    if (shared.maxFishabilityScore != null && shared.maxFishabilityScore > 0) {
      filters.push(Prisma.sql`s."fishabilityScore" <= ${shared.maxFishabilityScore}`);
    }

    // Accès physique : booléens dans le JSON `accessibility` (parking/boatLaunch/pmr/night).
    // Le flag est borné en `text` (clé JSON) ; les valeurs proviennent d'une liste figée.
    for (const flag of activeAccessibilityFlags(shared)) {
      filters.push(Prisma.sql`s."accessibility"->>(${flag}::text) = 'true'`);
    }

    if (origin === 'USER') {
      filters.push(Prisma.sql`s."dataOrigin" = ${'USER'}::"DataOrigin"`);
    }
    if (premiumOnly) {
      filters.push(Prisma.sql`s."isPremium" = true`);
    }

    const filterSql = filters.length > 0
      ? Prisma.sql`AND ${Prisma.join(filters, ' AND ')}`
      : Prisma.empty;

    const rows = await prisma.$queryRaw<MvtRow[]>(Prisma.sql`
      WITH bounds AS (
        SELECT ST_TileEnvelope(${z}, ${x}, ${y}) AS geom
      ),
      mvtgeom AS (
        SELECT
          ST_AsMVTGeom(
            ST_Transform(ST_SetSRID(ST_MakePoint(s."longitude", s."latitude"), 4326), 3857),
            bounds.geom,
            4096,
            64,
            true
          ) AS geom,
          s."id",
          s."slug",
          s."name",
          s."department",
          s."commune",
          s."waterType"::text AS "waterType",
          s."waterCategory"::text AS "waterCategory",
          array_to_string(s."fishingTypes"::text[], ',') AS "fishingTypes",
          s."averageRating",
          s."reviewCount",
          s."isPremium",
          s."isVerified",
          s."fishabilityScore",
          s."dataOrigin"::text AS "dataOrigin",
          s."accessType"::text AS "accessType"
        FROM "spots" s, bounds
        WHERE s."status" = ${'APPROVED'}::"SpotStatus"
          AND ST_Intersects(s."geometry", ST_Transform(bounds.geom, 4326)::geography)
          ${filterSql}
        ORDER BY s."averageRating" DESC NULLS LAST
        LIMIT CASE
          WHEN ${z} < 7 THEN 500
          WHEN ${z} < 9 THEN 1500
          ELSE 5000
        END
      )
      SELECT ST_AsMVT(mvtgeom.*, 'spots', 4096, 'geom') AS mvt
      FROM mvtgeom
    `);

    const tile = rows[0]?.mvt ? Buffer.from(rows[0].mvt) : Buffer.alloc(0);

    return new NextResponse(tile, {
      headers: {
        'Content-Type': 'application/vnd.mapbox-vector-tile',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('GET /api/spots/tiles/[z]/[x]/[y] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
