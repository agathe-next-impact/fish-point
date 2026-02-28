import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createCatchSchema } from '@/validators/catch.schema';
import { z } from 'zod';

const syncRequestSchema = z.object({
  catches: z.array(createCatchSchema).min(1).max(50),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = syncRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { catches } = validation.data;
    let synced = 0;
    let skipped = 0;

    // Collect all clientIds to check for existing catches in a single query
    const clientIds = catches
      .map((c) => c.clientId)
      .filter((id): id is string => !!id);

    const existingCatches = clientIds.length > 0
      ? await prisma.catch.findMany({
          where: { clientId: { in: clientIds } },
          select: { clientId: true },
        })
      : [];

    const existingClientIds = new Set(existingCatches.map((c) => c.clientId));

    // Process each catch
    for (const catchData of catches) {
      // Skip if clientId already exists (deduplication)
      if (catchData.clientId && existingClientIds.has(catchData.clientId)) {
        skipped++;
        continue;
      }

      try {
        await prisma.catch.create({
          data: {
            userId: session.user.id,
            spotId: catchData.spotId,
            speciesId: catchData.speciesId,
            weight: catchData.weight,
            length: catchData.length,
            technique: catchData.technique,
            bait: catchData.bait,
            imageUrl: catchData.imageUrl,
            notes: catchData.notes,
            isReleased: catchData.isReleased ?? true,
            caughtAt: catchData.caughtAt ? new Date(catchData.caughtAt) : new Date(),
            lureType: catchData.lureType,
            lureColor: catchData.lureColor,
            lureSize: catchData.lureSize,
            rigType: catchData.rigType,
            hookSize: catchData.hookSize,
            lineWeight: catchData.lineWeight,
            catchLatitude: catchData.catchLatitude,
            catchLongitude: catchData.catchLongitude,
            windSpeed: catchData.windSpeed,
            windDirection: catchData.windDirection,
            cloudCover: catchData.cloudCover,
            humidity: catchData.humidity,
            clientId: catchData.clientId,
            syncedAt: new Date(),
            isPublic: catchData.isPublic ?? true,
          },
        });
        synced++;
      } catch (error) {
        // If unique constraint violation on clientId, count as skipped
        if (
          error instanceof Error &&
          error.message.includes('Unique constraint')
        ) {
          skipped++;
        } else {
          console.error('Sync catch creation error:', error);
          skipped++;
        }
      }
    }

    return NextResponse.json({ synced, skipped });
  } catch (error) {
    console.error('POST /api/catches/sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
