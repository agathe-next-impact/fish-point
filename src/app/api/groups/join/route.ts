import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { joinGroupSchema } from '@/validators/group.schema';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = joinGroupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const group = await prisma.fishingGroup.findUnique({
      where: { inviteCode: validation.data.inviteCode },
    });

    if (!group) {
      return NextResponse.json({ error: "Code d'invitation invalide" }, { status: 404 });
    }

    // Check if already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'Vous êtes déjà membre de ce groupe' }, { status: 409 });
    }

    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: session.user.id,
        role: 'MEMBER',
      },
    });

    return NextResponse.json({ data: group }, { status: 201 });
  } catch (error) {
    console.error('POST /api/groups/join error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
