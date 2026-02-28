import { NextRequest, NextResponse } from 'next/server';
import { refreshStaticScores } from '@/services/scoring.service';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Refreshing static scores...');

    const result = await refreshStaticScores();

    console.log(`Static scores refreshed: ${result.updated} spots updated`);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Refresh static scores error:', error);
    return NextResponse.json(
      { error: 'Static score refresh failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
