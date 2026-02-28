import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { updatePrivateSpotSchema } from '@/validators/private-spot.schema';

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
    const spot = await prisma.privateSpot.findUnique({
      where: { id },
      include: {
        visits: {
          orderBy: { visitDate: 'desc' },
        },
      },
    });

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    if (spot.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: spot });
  } catch (error) {
    console.error('GET /api/private-spots/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updatePrivateSpotSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const spot = await prisma.privateSpot.findUnique({ where: { id } });
    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }
    if (spot.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.privateSpot.update({
      where: { id },
      data: validation.data as Record<string, unknown>,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PATCH /api/private-spots/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.privateSpot.delete({ where: { id } });
    return NextResponse.json({ data: null });
  } catch (error) {
    console.error('DELETE /api/private-spots/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
