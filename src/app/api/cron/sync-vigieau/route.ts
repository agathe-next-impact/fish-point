import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchDroughtRestriction } from '@/services/vigieau.service';

export const maxDuration = 300;

/**
 * Sync drought restrictions for all approved spots.
 * Creates/updates WATER_RESTRICTION regulations when restrictions are active.
 * Run every 2 hours.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const departement = searchParams.get('departement') || undefined;

  try {
    const whereClause: Record<string, unknown> = { status: 'APPROVED' };
    if (departement) whereClause.department = departement;

    const spots = await prisma.spot.findMany({
      where: whereClause,
      select: { id: true, latitude: true, longitude: true },
    });

    let restrictionsCreated = 0;
    let restrictionsRemoved = 0;

    // Group spots by grid cell (~10km) to reduce API calls
    const gridCells = new Map<string, typeof spots>();
    for (const spot of spots) {
      const key = `${(spot.latitude * 10).toFixed(0)}_${(spot.longitude * 10).toFixed(0)}`;
      const group = gridCells.get(key) ?? [];
      group.push(spot);
      gridCells.set(key, group);
    }

    for (const [, cellSpots] of gridCells) {
      const representative = cellSpots[0];
      try {
        const restriction = await fetchDroughtRestriction(representative.latitude, representative.longitude);

        for (const spot of cellSpots) {
          if (restriction && restriction.fishingImpacted) {
            // Upsert active water restriction
            const existing = await prisma.spotRegulation.findFirst({
              where: { spotId: spot.id, type: 'WATER_RESTRICTION', isActive: true },
            });

            if (!existing) {
              await prisma.spotRegulation.create({
                data: {
                  spotId: spot.id,
                  type: 'WATER_RESTRICTION',
                  description: restriction.description,
                  isActive: true,
                  source: 'VigiEau',
                  lastSyncedAt: new Date(),
                },
              });
              restrictionsCreated++;
            } else {
              await prisma.spotRegulation.update({
                where: { id: existing.id },
                data: { description: restriction.description, lastSyncedAt: new Date() },
              });
            }
          } else {
            // Deactivate any existing water restriction
            const deactivated = await prisma.spotRegulation.updateMany({
              where: { spotId: spot.id, type: 'WATER_RESTRICTION', isActive: true },
              data: { isActive: false },
            });
            restrictionsRemoved += deactivated.count;
          }
        }
      } catch {
        // Non-critical — skip this cell
      }
    }

    return NextResponse.json({
      success: true,
      processed: spots.length,
      gridCells: gridCells.size,
      restrictionsCreated,
      restrictionsRemoved,
    });
  } catch (error) {
    console.error('Sync VigiEau cron error:', error);
    return NextResponse.json(
      { error: 'VigiEau sync failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
