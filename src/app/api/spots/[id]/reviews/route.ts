import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createReviewSchema } from '@/validators/review.schema';
import { invalidateCache } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { spotId: id },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { spotId: id } }),
    ]);
    return NextResponse.json({
      data: reviews,
      meta: { total, page, limit, hasMore: skip + limit < total },
    });
  } catch (error) {
    console.error('GET reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = createReviewSchema.safeParse({ ...body, spotId: id });
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation error', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        rating: validation.data.rating,
        comment: validation.data.comment,
        fishDensity: validation.data.fishDensity,
        cleanliness: validation.data.cleanliness,
        tranquility: validation.data.tranquility,
        accessibility: validation.data.accessibility,
        userId: session.user.id,
        spotId: id,
      },
    });

    // Update spot average
    const agg = await prisma.review.aggregate({
      where: { spotId: id },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.spot.update({
      where: { id },
      data: {
        averageRating: agg._avg.rating || 0,
        reviewCount: agg._count,
      },
    });

    await invalidateCache(`spots:search:*`);

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    console.error('POST review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
