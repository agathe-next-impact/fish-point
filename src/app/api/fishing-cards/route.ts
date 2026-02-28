import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createFishingCardSchema } from '@/validators/fishing-card.schema';

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

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cards = await prisma.fishingCard.findMany({
      where: { userId: session.user.id },
      orderBy: { endDate: 'desc' },
    });

    const data = cards.map(addComputedFields);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/fishing-cards error:', error);
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
    const validation = createFishingCardSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = validation.data;

    const card = await prisma.fishingCard.create({
      data: {
        userId: session.user.id,
        cardNumber: data.cardNumber,
        aappma: data.aappma,
        department: data.department,
        federation: data.federation,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        hasReciprocity: data.hasReciprocity ?? false,
        reciprocityType: data.reciprocityType,
        imageUrl: data.imageUrl,
      },
    });

    return NextResponse.json({ data: addComputedFields(card) }, { status: 201 });
  } catch (error) {
    console.error('POST /api/fishing-cards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
