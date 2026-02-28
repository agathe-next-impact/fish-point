import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { shareCatchSchema } from '@/validators/feed.schema';

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

    // Verify the catch exists and belongs to the user
    const catchRecord = await prisma.catch.findUnique({ where: { id } });
    if (!catchRecord) {
      return NextResponse.json({ error: 'Catch not found' }, { status: 404 });
    }
    if (catchRecord.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if already shared
    const existing = await prisma.sharedCatch.findUnique({ where: { catchId: id } });
    if (existing) {
      return NextResponse.json({ error: 'Cette prise est déjà partagée' }, { status: 409 });
    }

    const body = await request.json();
    const validation = shareCatchSchema.safeParse({ ...body, catchId: id });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const sharedCatch = await prisma.sharedCatch.create({
      data: {
        catchId: id,
        userId: session.user.id,
        blurLocation: validation.data.blurLocation,
        caption: validation.data.caption,
      },
      include: {
        catch: {
          select: {
            id: true,
            weight: true,
            length: true,
            technique: true,
            imageUrl: true,
            caughtAt: true,
            species: { select: { id: true, name: true } },
            spot: { select: { id: true, name: true } },
          },
        },
        user: { select: { id: true, name: true, username: true, image: true } },
      },
    });

    return NextResponse.json({ data: sharedCatch }, { status: 201 });
  } catch (error) {
    console.error('POST /api/catches/[id]/share error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
