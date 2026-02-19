import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createCatchSchema } from '@/validators/catch.schema';

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

    return NextResponse.json({ data: catchRecord }, { status: 201 });
  } catch (error) {
    console.error('POST /api/catches error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
