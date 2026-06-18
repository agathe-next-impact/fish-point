import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * Frontière favoris. `listName` permet déjà les collections au niveau data
 * (À tester / Favoris / Sortie de samedi). L'UI de sélection de collection est
 * hors périmètre de cette tranche : on garde le défaut « default ».
 */
const saveFavoriteSchema = z.object({
  spotId: z.string().min(1),
  listName: z.string().min(1).max(60).default('default'),
});

const removeFavoriteSchema = z.object({
  spotId: z.string().min(1),
  listName: z.string().min(1).max(60).default('default'),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        spot: {
          select: {
            id: true,
            name: true,
            slug: true,
            department: true,
            waterType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ data: favorites });
  } catch (error) {
    console.error('GET /api/spots/favorites error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Enregistre un spot (idempotent grâce à l'unique [userId, spotId, listName]). */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = saveFavoriteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { spotId, listName } = validation.data;

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_spotId_listName: { userId: session.user.id, spotId, listName },
      },
      create: { userId: session.user.id, spotId, listName },
      update: {},
    });

    return NextResponse.json({ data: favorite }, { status: 201 });
  } catch (error) {
    console.error('POST /api/spots/favorites error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Retire un spot enregistré (Annuler / bascule depuis le bouton). */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = removeFavoriteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { spotId, listName } = validation.data;

    await prisma.favorite.deleteMany({
      where: { userId: session.user.id, spotId, listName },
    });

    return NextResponse.json({ data: { spotId, listName } });
  } catch (error) {
    console.error('DELETE /api/spots/favorites error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
