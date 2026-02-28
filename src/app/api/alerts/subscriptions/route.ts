import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createAlertSubscriptionSchema } from '@/validators/alert.schema';
import type { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await prisma.alertSubscription.findMany({
      where: { userId: session.user.id },
      include: {
        spot: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: subscriptions });
  } catch (error) {
    console.error('GET /api/alerts/subscriptions error:', error);
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
    const validation = createAlertSubscriptionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = validation.data;

    // If spotId is provided, verify the spot exists
    if (data.spotId) {
      const spot = await prisma.spot.findUnique({ where: { id: data.spotId } });
      if (!spot) {
        return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
      }
    }

    const subscription = await prisma.alertSubscription.create({
      data: {
        userId: session.user.id,
        type: data.type,
        spotId: data.spotId,
        config: (data.config ?? undefined) as Prisma.InputJsonValue | undefined,
        isActive: data.isActive,
      },
      include: {
        spot: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ data: subscription }, { status: 201 });
  } catch (error) {
    console.error('POST /api/alerts/subscriptions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
