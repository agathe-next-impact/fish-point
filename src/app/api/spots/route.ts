import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import {
  createSpotSchema,
  spotsListQuerySchema,
  toSpotQueryFilters,
} from '@/validators/spot.schema';
import { slugify } from '@/lib/utils';
import { resolveDepartment } from '@/services/geocoding.service';
import { spotListSelect, toSpotListItem } from '@/lib/spot-list-select';
import type { Prisma } from '@prisma/client';
import { buildSpotWhere } from '@/lib/spot-where';
import { resolveParentWaterBodyId } from '@/lib/spot-hierarchy';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validation Zod à la frontière (cible projet). Les query params multivalués
    // (waterType, species, mode, technique…) sont collectés via getAll.
    const raw = {
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      department: searchParams.get('department') ?? undefined,
      kind: searchParams.getAll('kind'),
      waterType: searchParams.getAll('waterType'),
      waterCategory: searchParams.get('waterCategory') ?? undefined,
      fishCategory: searchParams.getAll('fishCategory'),
      accessType: searchParams.get('accessType') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      minRating: searchParams.get('minRating') ?? undefined,
      minFishabilityScore: searchParams.get('minFishabilityScore') ?? undefined,
      maxFishabilityScore: searchParams.get('maxFishabilityScore') ?? undefined,
      species: searchParams.getAll('species'),
      fishingMode: searchParams.getAll('fishingMode'),
      fishingTechnique: searchParams.getAll('fishingTechnique'),
      parking: searchParams.get('parking') ?? undefined,
      boatLaunch: searchParams.get('boatLaunch') ?? undefined,
      pmr: searchParams.get('pmr') ?? undefined,
      nightFishing: searchParams.get('nightFishing') ?? undefined,
      // Filtres « affichage » (parité liste/carte, sous-étape 5) : mêmes noms de
      // params que la route tuiles — `premiumOnly=true` et `origin=USER`.
      premiumOnly: searchParams.get('premiumOnly') ?? undefined,
      origin: searchParams.get('origin') ?? undefined,
      lat: searchParams.get('lat') ?? undefined,
      lng: searchParams.get('lng') ?? undefined,
      radius: searchParams.get('radius') ?? undefined,
      north: searchParams.get('north') ?? undefined,
      south: searchParams.get('south') ?? undefined,
      east: searchParams.get('east') ?? undefined,
      west: searchParams.get('west') ?? undefined,
    };

    const parsed = spotsListQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const q = parsed.data;

    const page = q.page;
    const limit = q.limit;
    const skip = (page - 1) * limit;

    // Filtres « sortie » canoniques (sous-ensemble partagé liste/carte) → WHERE Prisma.
    // Le mapping query → `SpotQueryFilters` est centralisé dans `spot.schema.ts`
    // (`toSpotQueryFilters`) ; la traduction filtres → where est la source UNIQUE
    // `@/lib/spot-where`. Les arrays vides (defaults `[]`) deviennent `undefined`,
    // ignorés de toute façon par `buildSpotWhere` (gardes `length > 0`).
    const filters = toSpotQueryFilters(q);

    // base `status` + filtres canoniques ; les bornes géo (hors type canonique)
    // sont fusionnées ci-dessous, propres à la liste.
    const where: Prisma.SpotWhereInput = {
      status: 'APPROVED',
      ...buildSpotWhere(filters),
    };

    // Bornes géographiques optionnelles (zone Explorer committée) : bornent la
    // liste à la même fenêtre que la carte. Rétro-compatible : sans ces params,
    // le comportement reste inchangé. Filtre simple lat/lng, pas de PostGIS requis.
    if (
      q.north !== undefined &&
      q.south !== undefined &&
      q.east !== undefined &&
      q.west !== undefined
    ) {
      where.latitude = { gte: q.south, lte: q.north };
      where.longitude = { gte: q.west, lte: q.east };
    }

    // Distance « autour de moi » : approximation par bounding box (1° lat ≈ 111 km,
    // 1° lng ≈ 111 km × cos(lat)). Suffisant pour un filtre liste ; le tri par
    // distance exact reste hors scope (pas de PostGIS ici). N'est appliqué que si
    // aucune zone carte n'est déjà committée (la bbox carte prime).
    if (
      q.lat !== undefined &&
      q.lng !== undefined &&
      q.radius !== undefined &&
      where.latitude === undefined
    ) {
      const latDelta = q.radius / 111_000;
      const cos = Math.cos((q.lat * Math.PI) / 180);
      const lngDelta = q.radius / (111_000 * (Math.abs(cos) < 1e-6 ? 1e-6 : cos));
      where.latitude = { gte: q.lat - latDelta, lte: q.lat + latDelta };
      where.longitude = { gte: q.lng - Math.abs(lngDelta), lte: q.lng + Math.abs(lngDelta) };
    }

    const [spots, total] = await Promise.all([
      prisma.spot.findMany({
        where,
        select: spotListSelect,
        orderBy: { averageRating: 'desc' },
        skip,
        take: limit,
      }),
      prisma.spot.count({ where }),
    ]);

    const data = spots.map(toSpotListItem);

    return NextResponse.json({
      data,
      meta: { total, page, limit, hasMore: skip + limit < total },
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('GET /api/spots error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createSpotSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = validation.data;
    const slug = slugify(data.name) + '-' + Date.now().toString(36);

    const geo = await resolveDepartment(data.latitude, data.longitude);

    // Modèle 3 niveaux : une zone d'accès est rattachée au plan d'eau le plus proche
    // (résolution serveur, NULL si aucun dans le rayon — réversible, non bloquant).
    // Un plan d'eau n'a pas de parent.
    const parentId =
      data.kind === 'ACCESS_ZONE'
        ? await resolveParentWaterBodyId(data.latitude, data.longitude)
        : null;

    const spot = await prisma.spot.create({
      data: {
        slug,
        name: data.name,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        department: geo?.departmentCode ?? '',
        commune: geo?.commune ?? '',
        waterType: data.waterType,
        waterCategory: data.waterCategory,
        fishingTypes: data.fishingTypes,
        accessibility: data.accessibility as Record<string, boolean> | undefined,
        kind: data.kind,
        parentId,
        authorId: session.user.id,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ data: spot }, { status: 201 });
  } catch (error) {
    console.error('POST /api/spots error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
