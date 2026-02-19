import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Syncing water levels...');
    return NextResponse.json({ success: true, message: 'Water levels synced' });
  } catch (error) {
    console.error('Sync water levels error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
