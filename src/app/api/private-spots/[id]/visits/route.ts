import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createVisitSchema } from '@/validators/private-spot.schema';
import type { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const spot = await prisma.privateSpot.findUnique({ where: { id } });
    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }
    if (spot.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const visits = await prisma.privateSpotVisit.findMany({
      where: { privateSpotId: id },
      orderBy: { visitDate: 'desc' },
    });

    return NextResponse.json({ data: visits });
  } catch (error) {
    console.error('GET /api/private-spots/[id]/visits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const spot = await prisma.privateSpot.findUnique({ where: { id } });
    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }
    if (spot.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createVisitSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const visit = await prisma.privateSpotVisit.create({
      data: {
        privateSpotId: id,
        notes: validation.data.notes,
        rating: validation.data.rating,
        conditions: (validation.data.conditions ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    return NextResponse.json({ data: visit }, { status: 201 });
  } catch (error) {
    console.error('POST /api/private-spots/[id]/visits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
