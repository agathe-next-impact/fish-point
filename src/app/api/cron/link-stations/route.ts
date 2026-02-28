import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findNearestStation } from '@/services/water.service';
import { findNearestTempStation } from '@/services/hubeau-temperature.service';

export const maxDuration = 300;

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
  const type = searchParams.get('type') || 'all'; // 'hydro', 'temp', or 'all'

  try {
    const whereClause: Record<string, unknown> = { status: 'APPROVED' };
    if (departement) whereClause.department = departement;

    // Only process spots that don't have stations linked yet
    if (type === 'hydro') {
      whereClause.hydroStationCode = null;
    } else if (type === 'temp') {
      whereClause.tempStationCode = null;
    } else {
      whereClause.OR = [
        { hydroStationCode: null },
        { tempStationCode: null },
      ];
    }

    const spots = await prisma.spot.findMany({
      where: whereClause,
      select: { id: true, latitude: true, longitude: true, hydroStationCode: true, tempStationCode: true },
    });

    let hydroLinked = 0;
    let tempLinked = 0;

    for (const spot of spots) {
      // Link hydro station
      if (!spot.hydroStationCode && (type === 'all' || type === 'hydro')) {
        try {
          const stationCode = await findNearestStation(spot.latitude, spot.longitude);
          if (stationCode) {
            await prisma.spot.update({
              where: { id: spot.id },
              data: { hydroStationCode: stationCode },
            });
            hydroLinked++;
          }
        } catch {
          // Non-critical
        }
      }

      // Link temp station
      if (!spot.tempStationCode && (type === 'all' || type === 'temp')) {
        try {
          const station = await findNearestTempStation(spot.latitude, spot.longitude);
          if (station) {
            await prisma.spot.update({
              where: { id: spot.id },
              data: { tempStationCode: station.code_station },
            });
            tempLinked++;
          }
        } catch {
          // Non-critical
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: spots.length,
      hydroLinked,
      tempLinked,
    });
  } catch (error) {
    console.error('Link stations cron error:', error);
    return NextResponse.json(
      { error: 'Station linking failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
