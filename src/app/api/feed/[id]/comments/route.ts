import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createCommentSchema } from '@/validators/feed.schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const sharedCatch = await prisma.sharedCatch.findUnique({ where: { id } });
    if (!sharedCatch) {
      return NextResponse.json({ error: 'Shared catch not found' }, { status: 404 });
    }

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '30'), 50);
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.sharedCatchComment.findMany({
        where: { sharedCatchId: id },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.sharedCatchComment.count({ where: { sharedCatchId: id } }),
    ]);

    return NextResponse.json({
      data: comments,
      meta: { total, page, limit, hasMore: skip + limit < total },
    });
  } catch (error) {
    console.error('GET /api/feed/[id]/comments error:', error);
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

    const sharedCatch = await prisma.sharedCatch.findUnique({ where: { id } });
    if (!sharedCatch) {
      return NextResponse.json({ error: 'Shared catch not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = createCommentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const comment = await prisma.sharedCatchComment.create({
      data: {
        sharedCatchId: id,
        userId: session.user.id,
        content: validation.data.content,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/feed/[id]/comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
