import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check membership
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: session.user.id } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const members = await prisma.groupMember.findMany({
      where: { groupId: id },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json({ data: members });
  } catch (error) {
    console.error('GET /api/groups/[id]/members error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
