import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createSpotSchema, spotFiltersSchema } from '@/validators/spot.schema';
import { slugify } from '@/lib/utils';
import { resolveDepartment } from '@/services/geocoding.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string | string[]> = {};
    searchParams.forEach((value, key) => {
      const existing = params[key];
      if (existing) {
        params[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      } else {
        params[key] = value;
      }
    });

    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 500);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status: 'APPROVED' };

    if (searchParams.get('department')) {
      where.department = searchParams.get('department');
    }
    if (searchParams.get('waterType')) {
      where.waterType = { in: searchParams.getAll('waterType') };
    }
    if (searchParams.get('search')) {
      where.OR = [
        { name: { contains: searchParams.get('search'), mode: 'insensitive' } },
        { commune: { contains: searchParams.get('search'), mode: 'insensitive' } },
      ];
    }

    if (searchParams.get('accessType')) {
      const at = searchParams.get('accessType');
      if (at === 'FREE') {
        // "Libre" includes spots with null accessType (default)
        if (!where.AND) where.AND = [];
        (where.AND as unknown[]).push({
          OR: [{ accessType: 'FREE' }, { accessType: null }],
        });
      } else {
        where.accessType = at;
      }
    }
    if (searchParams.get('waterCategory')) {
      where.waterCategory = searchParams.get('waterCategory');
    }
    if (searchParams.get('fishCategory')) {
      where.species = {
        some: { species: { category: { in: searchParams.getAll('fishCategory') } } },
      };
    }

    const minRating = parseFloat(searchParams.get('minRating') || '0');
    if (minRating > 0) {
      where.averageRating = { gte: minRating };
    }

    const minScore = parseFloat(searchParams.get('minFishabilityScore') || '0');
    const maxScore = parseFloat(searchParams.get('maxFishabilityScore') || '0');
    if (minScore > 0 || maxScore > 0) {
      const scoreFilter: Record<string, number> = {};
      if (minScore > 0) scoreFilter.gte = minScore;
      if (maxScore > 0) scoreFilter.lte = maxScore;
      where.fishabilityScore = scoreFilter;
    }

    const [spots, total] = await Promise.all([
      prisma.spot.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
        },
        orderBy: { averageRating: 'desc' },
        skip,
        take: limit,
      }),
      prisma.spot.count({ where }),
    ]);

    const data = spots.map((spot) => ({
      id: spot.id,
      slug: spot.slug,
      name: spot.name,
      latitude: spot.latitude,
      longitude: spot.longitude,
      department: spot.department,
      commune: spot.commune,
      waterType: spot.waterType,
      waterCategory: spot.waterCategory,
      fishingTypes: spot.fishingTypes,
      averageRating: spot.averageRating,
      reviewCount: spot.reviewCount,
      isPremium: spot.isPremium,
      isVerified: spot.isVerified,
      primaryImage: spot.images[0]?.url || null,
      fishabilityScore: spot.fishabilityScore,
      dataOrigin: spot.dataOrigin,
      accessType: spot.accessType,
    }));

    return NextResponse.json({
      data,
      meta: { total, page, limit, hasMore: skip + limit < total },
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
