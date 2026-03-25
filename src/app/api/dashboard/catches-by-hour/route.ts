import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const speciesId = searchParams.get('speciesId');
    const spotId = searchParams.get('spotId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const conditions = [`c."userId" = $1`];
    const params: unknown[] = [session.user.id];
    let paramIndex = 2;

    if (speciesId) {
      conditions.push(`c."speciesId" = $${paramIndex++}`);
      params.push(speciesId);
    }
    if (spotId) {
      conditions.push(`c."spotId" = $${paramIndex++}`);
      params.push(spotId);
    }
    if (startDate) {
      conditions.push(`c."caughtAt" >= $${paramIndex++}`);
      params.push(new Date(startDate));
    }
    if (endDate) {
      conditions.push(`c."caughtAt" <= $${paramIndex++}`);
      params.push(new Date(endDate));
    }

    const rows = await prisma.$queryRawUnsafe<{ hour: number; count: bigint }[]>(`
      SELECT EXTRACT(HOUR FROM c."caughtAt")::int AS hour, COUNT(*)::bigint AS count
      FROM catches c
      WHERE ${conditions.join(' AND ')}
      GROUP BY hour
      ORDER BY hour
    `, ...params);

    const hourMap = new Map(rows.map((r) => [r.hour, Number(r.count)]));
    const data = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: hourMap.get(h) || 0,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/dashboard/catches-by-hour error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
