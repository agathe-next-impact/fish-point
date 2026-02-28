import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createTripSchema } from '@/validators/group.schema';

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

    // Check membership
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: session.user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const trips = await prisma.groupTrip.findMany({
      where: { groupId: id },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ data: trips });
  } catch (error) {
    console.error('GET /api/groups/[id]/trips error:', error);
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

    // Check membership
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: session.user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createTripSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const trip = await prisma.groupTrip.create({
      data: {
        groupId: id,
        title: validation.data.title,
        description: validation.data.description,
        spotId: validation.data.spotId,
        date: new Date(validation.data.date),
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({ data: trip }, { status: 201 });
  } catch (error) {
    console.error('POST /api/groups/[id]/trips error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
