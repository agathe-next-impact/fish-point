import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchWaterLevelByStation } from '@/services/water.service';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Syncing water levels...');

    // Get all unique hydro station codes
    const spots = await prisma.spot.findMany({
      where: {
        hydroStationCode: { not: null },
        status: 'APPROVED',
      },
      select: { hydroStationCode: true },
      distinct: ['hydroStationCode'],
    });

    const stationCodes = spots
      .map((s) => s.hydroStationCode)
      .filter(Boolean) as string[];

    let synced = 0;
    let failed = 0;

    for (const code of stationCodes) {
      try {
        const data = await fetchWaterLevelByStation(code);
        if (data) synced++;
        else failed++;
      } catch {
        failed++;
      }
    }

    console.log(`Water levels synced: ${synced} stations, ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: 'Water levels synced',
      synced,
      failed,
      total: stationCodes.length,
    });
  } catch (error) {
    console.error('Sync water levels error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
