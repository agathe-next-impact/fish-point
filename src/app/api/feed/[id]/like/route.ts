import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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

    // Check shared catch exists
    const sharedCatch = await prisma.sharedCatch.findUnique({ where: { id } });
    if (!sharedCatch) {
      return NextResponse.json({ error: 'Shared catch not found' }, { status: 404 });
    }

    // Toggle: if already liked, unlike; otherwise like
    const existingLike = await prisma.sharedCatchLike.findUnique({
      where: { sharedCatchId_userId: { sharedCatchId: id, userId: session.user.id } },
    });

    if (existingLike) {
      await prisma.sharedCatchLike.delete({ where: { id: existingLike.id } });
      return NextResponse.json({ data: { liked: false } });
    }

    await prisma.sharedCatchLike.create({
      data: {
        sharedCatchId: id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ data: { liked: true } }, { status: 201 });
  } catch (error) {
    console.error('POST /api/feed/[id]/like error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingLike = await prisma.sharedCatchLike.findUnique({
      where: { sharedCatchId_userId: { sharedCatchId: id, userId: session.user.id } },
    });

    if (!existingLike) {
      return NextResponse.json({ error: 'Like not found' }, { status: 404 });
    }

    await prisma.sharedCatchLike.delete({ where: { id: existingLike.id } });
    return NextResponse.json({ data: { liked: false } });
  } catch (error) {
    console.error('DELETE /api/feed/[id]/like error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
