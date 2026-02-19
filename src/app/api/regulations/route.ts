import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');

    if (!department) {
      return NextResponse.json({ error: 'department is required' }, { status: 400 });
    }

    const regulations = await prisma.spotRegulation.findMany({
      where: {
        spot: { department },
        isActive: true,
      },
      include: {
        spot: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: regulations });
  } catch (error) {
    console.error('GET regulations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
