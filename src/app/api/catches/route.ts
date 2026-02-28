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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const userId = searchParams.get('userId');
    const spotId = searchParams.get('spotId');

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (spotId) where.spotId = spotId;

    const [catches, total] = await Promise.all([
      prisma.catch.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, username: true, image: true } },
          spot: { select: { id: true, slug: true, name: true } },
          species: { select: { id: true, name: true, scientificName: true } },
        },
        orderBy: { caughtAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.catch.count({ where }),
    ]);

    return NextResponse.json({
      data: catches,
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
