import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ObservationCampaign {
  campaign: string;
  date: string;
  speciesCount: number;
  species: Array<{
    name: string;
    scientificName: string | null;
    count: number | null;
    averageWeight: number | null;
    averageLength: number | null;
  }>;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const spot = await prisma.spot.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });

    if (!spot) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    const observations = await prisma.speciesObservation.findMany({
      where: { spotId: spot.id },
      orderBy: { observationDate: 'desc' },
    });

    if (observations.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Group by campaign + date
    const campaignMap = new Map<string, typeof observations>();
    for (const obs of observations) {
      const key = `${obs.sourceCampaign || 'Campagne inconnue'}__${obs.observationDate.toISOString().slice(0, 10)}`;
      if (!campaignMap.has(key)) campaignMap.set(key, []);
      campaignMap.get(key)!.push(obs);
    }

    const campaigns: ObservationCampaign[] = [];
    for (const [key, obs] of campaignMap) {
      const [campaign, date] = key.split('__');
      campaigns.push({
        campaign,
        date: new Date(date).toISOString(),
        speciesCount: obs.length,
        species: obs.map((o) => ({
          name: o.speciesName,
          scientificName: o.scientificName,
          count: o.count,
          averageWeight: o.averageWeight,
          averageLength: o.averageLength,
        })),
      });
    }

    return NextResponse.json({ data: campaigns });
  } catch (error) {
    console.error('Observations error:', error);
    return NextResponse.json({ error: 'Failed to fetch observations' }, { status: 500 });
  }
}
