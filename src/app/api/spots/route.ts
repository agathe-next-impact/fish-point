import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import {
  createSpotSchema,
  WaterTypeEnum,
  WaterCategoryEnum,
  FishCategoryEnum,
} from '@/validators/spot.schema';
import { slugify } from '@/lib/utils';
import { resolveDepartment } from '@/services/geocoding.service';
import { spotListSelect, toSpotListItem } from '@/lib/spot-list-select';
import {
  FISHING_MODE_TYPES,
  FISHING_TECHNIQUE_TYPES,
} from '@/lib/fishing-type-classification';
import type { Prisma } from '@prisma/client';
import type { SpotQueryFilters } from '@/lib/spot-filter-params';
import { buildSpotWhere } from '@/lib/spot-where';

const AccessTypeEnum = z.enum([
  'FREE',
  'FISHING_CARD',
  'AAPPMA_SPECIFIC',
  'PAID',
  'MEMBERS_ONLY',
  'RESTRICTED',
  'PRIVATE',
]);
const FishingModeEnum = z.enum(FISHING_MODE_TYPES);
const FishingTechniqueEnum = z.enum(FISHING_TECHNIQUE_TYPES);

const numeric = (schema: z.ZodNumber) =>
  z.preprocess((v) => (v === undefined || v === '' ? undefined : Number(v)), schema);
const boolFlag = z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional();

/**
 * Validation Zod des query params de la liste Explorer (frontière /api/spots).
 * Tolérante : tout invalide → 400 ; les listes multivaluées arrivent via getAll.
 */
const spotsListQuerySchema = z.object({
  page: numeric(z.number().int().min(1)).optional().default(1),
  limit: numeric(z.number().int().min(1).max(100)).optional().default(20),
  department: z.string().min(1).optional(),
  waterType: z.array(WaterTypeEnum).default([]),
  waterCategory: WaterCategoryEnum.optional(),
  fishCategory: z.array(FishCategoryEnum).default([]),
  accessType: AccessTypeEnum.optional(),
  search: z.string().optional(),
  minRating: numeric(z.number().min(0).max(5)).optional(),
  minFishabilityScore: numeric(z.number().min(0).max(100)).optional(),
  maxFishabilityScore: numeric(z.number().min(0).max(100)).optional(),
  species: z.array(z.string().min(1)).default([]),
  fishingMode: z.array(FishingModeEnum).default([]),
  fishingTechnique: z.array(FishingTechniqueEnum).default([]),
  parking: boolFlag,
  boatLaunch: boolFlag,
  pmr: boolFlag,
  nightFishing: boolFlag,
  lat: numeric(z.number().min(-90).max(90)).optional(),
  lng: numeric(z.number().min(-180).max(180)).optional(),
  radius: numeric(z.number().min(100).max(200000)).optional(),
  north: numeric(z.number().min(-90).max(90)).optional(),
  south: numeric(z.number().min(-90).max(90)).optional(),
  east: numeric(z.number().min(-180).max(180)).optional(),
  west: numeric(z.number().min(-180).max(180)).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validation Zod à la frontière (cible projet). Les query params multivalués
    // (waterType, species, mode, technique…) sont collectés via getAll.
    const raw = {
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      department: searchParams.get('department') ?? undefined,
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
    // Source UNIQUE de la traduction filtres → where (cf. `@/lib/spot-where`). Les arrays
    // vides du schéma (defaults `[]`) deviennent `undefined` pour coller au type canonique ;
    // `buildSpotWhere` les ignore de toute façon (gardes `length > 0`).
    const filters: SpotQueryFilters = {
      department: q.department,
      waterType: q.waterType.length > 0 ? q.waterType : undefined,
      waterCategory: q.waterCategory,
      fishCategory: q.fishCategory.length > 0 ? q.fishCategory : undefined,
      accessType: q.accessType,
      search: q.search,
      minRating: q.minRating,
      minFishabilityScore: q.minFishabilityScore,
      maxFishabilityScore: q.maxFishabilityScore,
      species: q.species.length > 0 ? q.species : undefined,
      fishingMode: q.fishingMode.length > 0 ? q.fishingMode : undefined,
      fishingTechnique: q.fishingTechnique.length > 0 ? q.fishingTechnique : undefined,
      parking: q.parking,
      boatLaunch: q.boatLaunch,
      pmr: q.pmr,
      nightFishing: q.nightFishing,
    };

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
