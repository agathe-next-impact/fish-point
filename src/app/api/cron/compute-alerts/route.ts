import { NextRequest, NextResponse } from 'next/server';
import { runAllAlerts } from '@/services/alert-engine.service';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Running alert computation...');

    const summary = await runAllAlerts();

    console.log(
      `Alert computation complete: ${summary.usersProcessed} users processed, ${summary.alertsTriggered} alerts triggered, ${summary.errors} errors`,
    );

    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error('Compute alerts error:', error);
    return NextResponse.json(
      { error: 'Alert computation failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
