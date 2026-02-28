import { NextRequest, NextResponse } from 'next/server';
import { checkCardExpiryReminders } from '@/services/alert-engine.service';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Checking fishing card expiry reminders...');

    const result = await checkCardExpiryReminders();

    console.log(
      `Card expiry check complete: ${result.processed} cards processed, ${result.reminders} reminders sent`,
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Card expiry reminders error:', error);
    return NextResponse.json(
      { error: 'Card expiry check failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
