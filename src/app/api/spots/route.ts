import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createSpotSchema, spotFiltersSchema } from '@/validators/spot.schema';
import { slugify } from '@/lib/utils';
import { reverseGeocode } from '@/services/geocoding.service';
import { buildApprovedSpotWhere, serializeSpotListItem, spotListSelect } from '@/server/spots';
import { searchParamsToObject } from '@/lib/search-params';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validation = spotFiltersSchema.safeParse(searchParamsToObject(searchParams));

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const filters = validation.data;
    const skip = (filters.page - 1) * filters.limit;
    const where = buildApprovedSpotWhere(filters);

    const [spots, total] = await Promise.all([
      prisma.spot.findMany({
        where,
        select: spotListSelect,
        orderBy: { averageRating: 'desc' },
        skip,
        take: filters.limit,
      }),
      prisma.spot.count({ where }),
    ]);

    const data = spots.map(serializeSpotListItem);

    return NextResponse.json({
      data,
      meta: { total, page: filters.page, limit: filters.limit, hasMore: skip + filters.limit < total },
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
    const geocoded = data.department
      ? null
      : await reverseGeocode(data.latitude, data.longitude);
    const department = data.department ?? geocoded?.departmentCode ?? geocoded?.department;
    const commune = data.commune ?? geocoded?.commune;

    if (!department) {
      return NextResponse.json(
        { error: 'Unable to determine spot department from coordinates' },
        { status: 400 },
      );
    }

    const spot = await prisma.spot.create({
      data: {
        slug,
        name: data.name,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        department,
        commune,
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
