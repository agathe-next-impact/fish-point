import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { updateAlertSubscriptionSchema } from '@/validators/alert.schema';
import type { Prisma } from '@prisma/client';

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

    // Verify ownership
    const existing = await prisma.alertSubscription.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateAlertSubscriptionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = validation.data;

    // If spotId is being updated, verify the spot exists
    if (data.spotId) {
      const spot = await prisma.spot.findUnique({ where: { id: data.spotId } });
      if (!spot) {
        return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
      }
    }

    const updated = await prisma.alertSubscription.update({
      where: { id },
      data: {
        ...(data.type !== undefined && { type: data.type }),
        ...(data.spotId !== undefined && { spotId: data.spotId }),
        ...(data.config !== undefined && { config: data.config as Prisma.InputJsonValue }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        spot: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PATCH /api/alerts/subscriptions/[id] error:', error);
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

    const existing = await prisma.alertSubscription.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.alertSubscription.delete({ where: { id } });

    return NextResponse.json({ data: null });
  } catch (error) {
    console.error('DELETE /api/alerts/subscriptions/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
