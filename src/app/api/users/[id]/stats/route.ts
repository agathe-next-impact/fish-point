import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [user, catchCount, spotCount, reviewCount, biggestCatch, speciesStats] = await Promise.all([
      prisma.user.findUnique({ where: { id }, select: { xp: true, level: true } }),
      prisma.catch.count({ where: { userId: id } }),
      prisma.spot.count({ where: { authorId: id } }),
      prisma.review.count({ where: { userId: id } }),
      prisma.catch.findFirst({
        where: { userId: id },
        orderBy: { length: 'desc' },
        include: { species: { select: { name: true } }, spot: { select: { name: true } } },
      }),
      prisma.catch.groupBy({
        by: ['speciesId'],
        where: { userId: id },
        _count: true,
        orderBy: { _count: { speciesId: 'desc' } },
        take: 1,
      }),
    ]);

    let mostCaughtSpecies = null;
    if (speciesStats.length > 0) {
      const species = await prisma.fishSpecies.findUnique({ where: { id: speciesStats[0].speciesId } });
      mostCaughtSpecies = species ? { name: species.name, count: speciesStats[0]._count } : null;
    }

    return NextResponse.json({
      data: {
        totalSpots: spotCount,
        totalCatches: catchCount,
        totalReviews: reviewCount,
        xp: user?.xp || 0,
        level: user?.level || 1,
        biggestCatch,
        mostCaughtSpecies,
      },
    });
  } catch (error) {
    console.error('GET user stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
