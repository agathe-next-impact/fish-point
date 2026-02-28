import { NextRequest, NextResponse } from 'next/server';
import { ingestFishStations } from '@/services/spot-ingestion.service';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const departement = request.nextUrl.searchParams.get('departement') || undefined;

  try {
    console.log(`Starting spot ingestion${departement ? ` for department ${departement}` : ' (all France)'}...`);

    const result = await ingestFishStations({ departement });

    console.log(`Ingestion complete: ${result.spotsCreated} created, ${result.spotsUpdated} updated, ${result.spotsSkipped} skipped, ${result.observationsAdded} observations added in ${result.duration}ms`);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Spot ingestion error:', error);
    return NextResponse.json(
      { error: 'Ingestion failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
