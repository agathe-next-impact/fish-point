import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    if (q.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const species = await prisma.fishSpecies.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { scientificName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        scientificName: true,
        category: true,
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: species });
  } catch (error) {
    console.error('GET /api/species/search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
