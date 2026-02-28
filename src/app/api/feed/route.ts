import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    const [sharedCatches, total] = await Promise.all([
      prisma.sharedCatch.findMany({
        include: {
          catch: {
            select: {
              id: true,
              weight: true,
              length: true,
              technique: true,
              imageUrl: true,
              caughtAt: true,
              species: { select: { id: true, name: true } },
              spot: { select: { id: true, name: true, latitude: true, longitude: true } },
            },
          },
          user: { select: { id: true, name: true, username: true, image: true } },
          _count: { select: { likes: true, comments: true } },
          ...(currentUserId
            ? {
                likes: {
                  where: { userId: currentUserId },
                  select: { id: true },
                  take: 1,
                },
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.sharedCatch.count(),
    ]);

    const data = sharedCatches.map((sc) => {
      const { likes, ...rest } = sc as typeof sc & { likes?: { id: string }[] };

      // Blur coordinates if blurLocation is enabled
      const spot = rest.catch.spot;
      const blurredSpot = rest.blurLocation
        ? {
            ...spot,
            latitude: spot.latitude !== null ? Math.round(spot.latitude * 100) / 100 : null,
            longitude: spot.longitude !== null ? Math.round(spot.longitude * 100) / 100 : null,
          }
        : spot;

      return {
        ...rest,
        catch: {
          ...rest.catch,
          spot: blurredSpot,
        },
        isLikedByMe: currentUserId ? (likes?.length ?? 0) > 0 : false,
      };
    });

    return NextResponse.json({
      data,
      meta: { total, page, limit, hasMore: skip + limit < total },
    });
  } catch (error) {
    console.error('GET /api/feed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
