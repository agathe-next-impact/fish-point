import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findFirst({
      where: { OR: [{ id }, { username: id }] },
      select: {
        id: true, name: true, username: true, image: true, bio: true,
        level: true, xp: true, createdAt: true,
        _count: { select: { spots: true, catches: true, reviews: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ...user,
        spotsCount: user._count.spots,
        catchesCount: user._count.catches,
        reviewsCount: user._count.reviews,
      },
    });
  } catch (error) {
    console.error('GET user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
