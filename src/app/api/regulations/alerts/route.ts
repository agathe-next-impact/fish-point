import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const alerts = await prisma.spotRegulation.findMany({
      where: {
        isActive: true,
        type: { in: ['POLLUTION_ALERT', 'DROUGHT_ALERT', 'FLOOD_ALERT'] },
      },
      include: {
        spot: { select: { name: true, department: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const data = alerts.map((alert) => ({
      id: alert.id,
      type: alert.type,
      title: alert.description.slice(0, 100),
      description: alert.description,
      department: alert.spot.department,
      startDate: alert.startDate?.toISOString() || null,
      endDate: alert.endDate?.toISOString() || null,
      severity: alert.type === 'DROUGHT_ALERT' ? 'warning' : 'danger',
      source: alert.source,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
