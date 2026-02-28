import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        spot: {
          select: {
            id: true,
            name: true,
            slug: true,
            department: true,
            waterType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: favorites });
  } catch (error) {
    console.error('GET /api/spots/favorites error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
