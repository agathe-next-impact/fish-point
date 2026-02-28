import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createGroupSchema } from '@/validators/group.schema';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groups = await prisma.fishingGroup.findMany({
      where: {
        members: { some: { userId: session.user.id } },
      },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: groups });
  } catch (error) {
    console.error('GET /api/groups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createGroupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const group = await prisma.fishingGroup.create({
      data: {
        name: validation.data.name,
        description: validation.data.description,
        createdBy: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: 'ADMIN',
          },
        },
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json({ data: group }, { status: 201 });
  } catch (error) {
    console.error('POST /api/groups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
