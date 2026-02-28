import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { updateFishingCardSchema } from '@/validators/fishing-card.schema';

function addComputedFields(card: Record<string, unknown>) {
  const endDate = new Date(card.endDate as string);
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining < 0;
  const isExpiringSoon = !isExpired && daysRemaining <= 30;

  return {
    ...card,
    daysRemaining,
    isExpired,
    isExpiringSoon,
  };
}

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
    const card = await prisma.fishingCard.findUnique({ where: { id } });

    if (!card) {
      return NextResponse.json({ error: 'Fishing card not found' }, { status: 404 });
    }

    if (card.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: addComputedFields(card) });
  } catch (error) {
    console.error('GET /api/fishing-cards/[id] error:', error);
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
    const existing = await prisma.fishingCard.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Fishing card not found' }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateFishingCardSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = validation.data;

    const card = await prisma.fishingCard.update({
      where: { id },
      data: {
        ...(data.cardNumber !== undefined && { cardNumber: data.cardNumber }),
        ...(data.aappma !== undefined && { aappma: data.aappma }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.federation !== undefined && { federation: data.federation }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
        ...(data.hasReciprocity !== undefined && { hasReciprocity: data.hasReciprocity }),
        ...(data.reciprocityType !== undefined && { reciprocityType: data.reciprocityType }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      },
    });

    return NextResponse.json({ data: addComputedFields(card) });
  } catch (error) {
    console.error('PATCH /api/fishing-cards/[id] error:', error);
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
    const existing = await prisma.fishingCard.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Fishing card not found' }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.fishingCard.delete({ where: { id } });

    return NextResponse.json({ data: null });
  } catch (error) {
    console.error('DELETE /api/fishing-cards/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
