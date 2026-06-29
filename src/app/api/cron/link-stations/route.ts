import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findNearestStation } from '@/services/water.service';
import { findNearestTempStation } from '@/services/hubeau-temperature.service';
import { findNearestPiezoStation } from '@/services/hubeau-piezometrie.service';
import { findNearestHydrobioStation } from '@/services/hubeau-hydrobio.service';

export const maxDuration = 300;

async function processWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      await worker(item);
    }
  });
  await Promise.all(workers);
}

/**
 * Link spots to their nearest hydro and temperature stations.
 * Run once after ingestion, then weekly to catch new stations.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const departement = searchParams.get('departement') || undefined;
  const type = searchParams.get('type') || 'all'; // 'hydro', 'temp', 'piezo', 'hydrobio', or 'all'

  try {
    const whereClause: Record<string, unknown> = { status: 'APPROVED' };
    if (departement) whereClause.department = departement;

    // Only process spots that don't have stations linked yet
    if (type === 'hydro') {
      whereClause.hydroStationCode = null;
    } else if (type === 'temp') {
      whereClause.tempStationCode = null;
    } else if (type === 'piezo') {
      whereClause.piezoStationCode = null;
    } else if (type === 'hydrobio') {
      whereClause.hydrobioStationCode = null;
    } else {
      whereClause.OR = [
        { hydroStationCode: null },
        { tempStationCode: null },
        { piezoStationCode: null },
        { hydrobioStationCode: null },
      ];
    }

    const spots = await prisma.spot.findMany({
      where: whereClause,
      select: {
        id: true, latitude: true, longitude: true,
        hydroStationCode: true, tempStationCode: true,
        piezoStationCode: true, hydrobioStationCode: true,
      },
    });

    let hydroLinked = 0;
    let tempLinked = 0;
    let piezoLinked = 0;
    let hydrobioLinked = 0;

    await processWithConcurrency(spots, 6, async (spot) => {
      const updates: Record<string, string> = {};

      const [hydro, temp, piezo, hydrobio] = await Promise.allSettled([
        !spot.hydroStationCode && (type === 'all' || type === 'hydro')
          ? findNearestStation(spot.latitude, spot.longitude)
          : Promise.resolve(null),
        !spot.tempStationCode && (type === 'all' || type === 'temp')
          ? findNearestTempStation(spot.latitude, spot.longitude)
          : Promise.resolve(null),
        !spot.piezoStationCode && (type === 'all' || type === 'piezo')
          ? findNearestPiezoStation(spot.latitude, spot.longitude)
          : Promise.resolve(null),
        !spot.hydrobioStationCode && (type === 'all' || type === 'hydrobio')
          ? findNearestHydrobioStation(spot.latitude, spot.longitude)
          : Promise.resolve(null),
      ]);

      if (hydro.status === 'fulfilled' && hydro.value) {
        updates.hydroStationCode = hydro.value;
        hydroLinked++;
      }
      if (temp.status === 'fulfilled' && temp.value) {
        updates.tempStationCode = temp.value.code_station;
        tempLinked++;
      }
      if (piezo.status === 'fulfilled' && piezo.value) {
        updates.piezoStationCode = piezo.value.code_bss;
        piezoLinked++;
      }
      if (hydrobio.status === 'fulfilled' && hydrobio.value) {
        updates.hydrobioStationCode = hydrobio.value.code_station;
        hydrobioLinked++;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.spot.update({
          where: { id: spot.id },
          data: updates,
        });
      }
    });

    return NextResponse.json({
      success: true,
      processed: spots.length,
      hydroLinked,
      tempLinked,
      piezoLinked,
      hydrobioLinked,
    });
  } catch (error) {
    console.error('Link stations cron error:', error);
    return NextResponse.json(
      { error: 'Station linking failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
