import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCached } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');

    if (!department) {
      return NextResponse.json({ error: 'department is required' }, { status: 400 });
    }

    const cacheKey = `regulations:${department}`;
    const regulations = await getCached(cacheKey, () =>
      prisma.spotRegulation.findMany({
        where: {
          spot: { department },
          isActive: true,
        },
        include: {
          spot: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    3600);

    return NextResponse.json({ data: regulations }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (error) {
    console.error('GET regulations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
