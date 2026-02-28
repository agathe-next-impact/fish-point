import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { updateGroupSchema } from '@/validators/group.schema';

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

    const group = await prisma.fishingGroup.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, username: true, image: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
        trips: {
          orderBy: { date: 'asc' },
        },
        _count: { select: { members: true } },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ data: group });
  } catch (error) {
    console.error('GET /api/groups/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check admin membership
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: session.user.id } },
    });
    if (!membership || membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateGroupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const group = await prisma.fishingGroup.update({
      where: { id },
      data: validation.data,
      include: {
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json({ data: group });
  } catch (error) {
    console.error('PATCH /api/groups/[id] error:', error);
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

    // Only the creator (admin) can delete
    const group = await prisma.fishingGroup.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    if (group.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.fishingGroup.delete({ where: { id } });
    return NextResponse.json({ data: null });
  } catch (error) {
    console.error('DELETE /api/groups/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
