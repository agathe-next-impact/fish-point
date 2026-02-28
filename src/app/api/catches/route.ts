import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createCatchSchema } from '@/validators/catch.schema';
import { FISHBASE_DATA, estimateWeightFromLength } from '@/config/fishbase-data';

interface PlausibilityWarning {
  field: 'weight' | 'length' | 'weight_length_ratio';
  message: string;
}

function checkCatchPlausibility(
  weight: number | undefined,
  length: number | undefined,
  scientificName: string | null,
  maxWeightKg: number | null,
  maxLengthCm: number | null,
): PlausibilityWarning[] {
  const warnings: PlausibilityWarning[] = [];

  if (weight !== undefined && maxWeightKg !== null) {
    if (weight > maxWeightKg * 1.2) {
      warnings.push({
        field: 'weight',
        message: `Poids inhabituel: ${weight}kg dépasse 120% du record connu (${maxWeightKg}kg) pour cette espèce.`,
      });
    }
  }

  if (length !== undefined && maxLengthCm !== null) {
    if (length > maxLengthCm * 1.1) {
      warnings.push({
        field: 'length',
        message: `Taille inhabituelle: ${length}cm dépasse 110% du record connu (${maxLengthCm}cm) pour cette espèce.`,
      });
    }
  }

  if (weight !== undefined && length !== undefined && scientificName) {
    const fishbaseData = FISHBASE_DATA[scientificName];
    if (fishbaseData?.weightLengthA && fishbaseData?.weightLengthB) {
      const estimatedWeight = estimateWeightFromLength(
        length,
        fishbaseData.weightLengthA,
        fishbaseData.weightLengthB,
      );
      const ratio = weight / estimatedWeight;
      if (ratio > 3.0 || ratio < 0.1) {
        warnings.push({
          field: 'weight_length_ratio',
          message: `Combinaison poids/taille peu plausible: poids estimé ~${estimatedWeight.toFixed(2)}kg pour ${length}cm.`,
        });
      }
    }
  }

  return warnings;
}

// Fields that are always safe to return publicly (no private coordinates)
const publicCatchSelect = {
  id: true,
  weight: true,
  length: true,
  technique: true,
  bait: true,
  imageUrl: true,
  notes: true,
  isReleased: true,
  caughtAt: true,
  weatherTemp: true,
  weatherDesc: true,
  pressure: true,
  moonPhase: true,
  waterTemp: true,
  createdAt: true,
  lureType: true,
  lureColor: true,
  lureSize: true,
  rigType: true,
  hookSize: true,
  lineWeight: true,
  windSpeed: true,
  windDirection: true,
  cloudCover: true,
  humidity: true,
  clientId: true,
  syncedAt: true,
  isPublic: true,
  userId: true,
  spotId: true,
  speciesId: true,
  user: { select: { id: true, name: true, username: true, image: true } },
  spot: { select: { id: true, slug: true, name: true } },
  species: { select: { id: true, name: true, scientificName: true } },
} as const;

// Includes private coordinates (only for owner)
const ownerCatchSelect = {
  ...publicCatchSelect,
  catchLatitude: true,
  catchLongitude: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const userId = searchParams.get('userId');
    const spotId = searchParams.get('spotId');

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (spotId) where.spotId = spotId;

    // If requesting a specific user's catches and it's the current user, include private coords
    const isOwnerRequest = userId && userId === currentUserId;

    const [catches, total] = await Promise.all([
      prisma.catch.findMany({
        where,
        select: isOwnerRequest ? ownerCatchSelect : publicCatchSelect,
        orderBy: { caughtAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.catch.count({ where }),
    ]);

    // If not a filtered owner request, we need to add coordinates only to owned catches
    const data = isOwnerRequest
      ? catches
      : catches.map((c) => {
          if (c.userId === currentUserId) {
            // Re-fetch would be expensive, but since we already omitted coords via select,
            // the owner will see their own catches without coords in mixed feeds.
            // For full coord access, they should filter by userId.
            return c;
          }
          return c;
        });

    return NextResponse.json({
      data,
      meta: { total, page, limit, hasMore: skip + limit < total },
    });
  } catch (error) {
    console.error('GET /api/catches error:', error);
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
    const validation = createCatchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation error', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = validation.data;

    // If clientId provided, check for duplicate (offline sync dedup)
    if (data.clientId) {
      const existing = await prisma.catch.findUnique({
        where: { clientId: data.clientId },
      });
      if (existing) {
        return NextResponse.json({ data: existing, deduplicated: true }, { status: 200 });
      }
    }

    // Fetch species for plausibility check
    const species = await prisma.fishSpecies.findUnique({
      where: { id: data.speciesId },
      select: { scientificName: true, maxWeightKg: true, maxLengthCm: true },
    });

    const catchRecord = await prisma.catch.create({
      data: {
        userId: session.user.id,
        spotId: data.spotId,
        speciesId: data.speciesId,
        weight: data.weight,
        length: data.length,
        technique: data.technique,
        bait: data.bait,
        imageUrl: data.imageUrl,
        notes: data.notes,
        isReleased: data.isReleased ?? true,
        caughtAt: data.caughtAt ? new Date(data.caughtAt) : new Date(),
        lureType: data.lureType,
        lureColor: data.lureColor,
        lureSize: data.lureSize,
        rigType: data.rigType,
        hookSize: data.hookSize,
        lineWeight: data.lineWeight,
        catchLatitude: data.catchLatitude,
        catchLongitude: data.catchLongitude,
        windSpeed: data.windSpeed,
        windDirection: data.windDirection,
        cloudCover: data.cloudCover,
        humidity: data.humidity,
        clientId: data.clientId,
        syncedAt: data.clientId ? new Date() : undefined,
        isPublic: data.isPublic ?? true,
      },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
        spot: { select: { id: true, slug: true, name: true } },
        species: { select: { id: true, name: true, scientificName: true } },
      },
    });

    const warnings = species
      ? checkCatchPlausibility(
          data.weight,
          data.length,
          species.scientificName,
          species.maxWeightKg,
          species.maxLengthCm,
        )
      : [];

    return NextResponse.json({ data: catchRecord, warnings }, { status: 201 });
  } catch (error) {
    console.error('POST /api/catches error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
