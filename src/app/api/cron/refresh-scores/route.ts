import { NextRequest, NextResponse } from 'next/server';
import { refreshDynamicScores } from '@/services/scoring.service';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const departement = request.nextUrl.searchParams.get('departement') || undefined;

  try {
    console.log(`Refreshing dynamic scores${departement ? ` for department ${departement}` : ''}...`);

    const result = await refreshDynamicScores({ departement });

    console.log(`Dynamic scores refreshed: ${result.updated} spots updated`);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Refresh scores error:', error);
    return NextResponse.json(
      { error: 'Score refresh failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
