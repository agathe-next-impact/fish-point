import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { DEFAULT_LIST_NAME, normalizeListName, normalizeNote } from '@/lib/collections';

/**
 * Frontière favoris. `listName` porte les collections au niveau data (cf.
 * `lib/collections.ts`) : une collection = l'ensemble des favoris d'un même
 * `listName`. Le défaut reste « default » (1-clic « Enregistrer »). La
 * normalisation (trim, compaction, troncature à la longueur max, retour au défaut
 * si vide) est l'unique autorité : pas de `.max()` qui rejetterait — on tronque.
 */
const listNameSchema = z
  .string()
  .default(DEFAULT_LIST_NAME)
  .transform(normalizeListName);

const saveFavoriteSchema = z.object({
  spotId: z.string().min(1),
  listName: listNameSchema,
});

const removeFavoriteSchema = z.object({
  spotId: z.string().min(1),
  listName: listNameSchema,
});

/**
 * Mise à jour de la note privée d'un favori. `note` accepte chaîne ou `null` ;
 * la normalisation (trim, troncature, `''`/espaces → `null`) est portée par
 * `normalizeNote` — unique autorité, on n'échoue jamais sur la longueur, on tronque.
 * `null`/'' efface la note. Portée serveur uniquement (compte requis).
 */
const updateNoteSchema = z.object({
  spotId: z.string().min(1),
  listName: listNameSchema,
  note: z
    .string()
    .nullable()
    .optional()
    .transform((value) => normalizeNote(value)),
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
          // Champs nécessaires à l'espace « Enregistrés » : coordonnées (tri par
          // distance + carte à venir), métadonnées d'affichage de la carte de spot.
          select: {
            id: true,
            name: true,
            slug: true,
            latitude: true,
            longitude: true,
            department: true,
            commune: true,
            waterType: true,
            waterCategory: true,
            fishingTypes: true,
            averageRating: true,
            reviewCount: true,
            isPremium: true,
            isVerified: true,
            fishabilityScore: true,
            accessType: true,
            dataOrigin: true,
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

/**
 * Met à jour la note privée d'un spot enregistré. Upsert sur la clé
 * [userId, spotId, listName] : si le favori existe on met à jour sa note, sinon
 * on le crée avec la note (cohérent avec POST, qui est lui aussi un upsert).
 * `note: null`/'' efface la note.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateNoteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { spotId, listName, note } = validation.data;

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_spotId_listName: { userId: session.user.id, spotId, listName },
      },
      create: { userId: session.user.id, spotId, listName, note },
      update: { note },
    });

    return NextResponse.json({ data: favorite });
  } catch (error) {
    console.error('PATCH /api/spots/favorites error:', error);
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
