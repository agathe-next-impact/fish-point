import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createPrivateSpotSchema } from '@/validators/private-spot.schema';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    const where = { userId: session.user.id };

    const [spots, total] = await Promise.all([
      prisma.privateSpot.findMany({
        where,
        include: {
          _count: { select: { visits: true } },
          visits: {
            orderBy: { visitDate: 'desc' },
            take: 1,
            select: { visitDate: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.privateSpot.count({ where }),
    ]);

    const data = spots.map((spot) => ({
      id: spot.id,
      name: spot.name,
      latitude: spot.latitude,
      longitude: spot.longitude,
      color: spot.color,
      icon: spot.icon,
      tags: spot.tags,
      visitCount: spot._count.visits,
      lastVisitDate: spot.visits[0]?.visitDate ?? null,
    }));

    return NextResponse.json({
      data,
      meta: { total, page, limit, hasMore: skip + limit < total },
    });
  } catch (error) {
    console.error('GET /api/private-spots error:', error);
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
    const validation = createPrivateSpotSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = validation.data;

    const spot = await prisma.privateSpot.create({
      data: {
        name: data.name,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        color: data.color,
        icon: data.icon,
        notes: data.notes,
        tags: data.tags || [],
        userId: session.user.id,
      },
    });

    return NextResponse.json({ data: spot }, { status: 201 });
  } catch (error) {
    console.error('POST /api/private-spots error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
