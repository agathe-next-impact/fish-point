import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const catchRecord = await prisma.catch.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
        spot: { select: { id: true, slug: true, name: true } },
        species: { select: { id: true, name: true, scientificName: true } },
      },
    });

    if (!catchRecord) {
      return NextResponse.json({ error: 'Catch not found' }, { status: 404 });
    }
    return NextResponse.json({ data: catchRecord });
  } catch (error) {
    console.error('GET catch error:', error);
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
    const catchRecord = await prisma.catch.findUnique({ where: { id } });
    if (!catchRecord) {
      return NextResponse.json({ error: 'Catch not found' }, { status: 404 });
    }
    if (catchRecord.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.catch.delete({ where: { id } });
    return NextResponse.json({ data: null });
  } catch (error) {
    console.error('DELETE catch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
