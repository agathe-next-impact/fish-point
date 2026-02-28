import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncQualityForAllSpots } from '@/services/hubeau-qualite.service';
import { enrichAllSpotsFromSandre } from '@/services/sandre.service';
import { updateCategoriesFromSandre } from '@/services/sandre-piscicole.service';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const departement = searchParams.get('departement') || undefined;
  const step = searchParams.get('step') || 'all';

  const results: Record<string, unknown> = {};

  try {
    // Step 1: Sync water quality data
    if (step === 'all' || step === 'quality') {
      const qualityResult = await syncQualityForAllSpots({ departement });
      results.quality = qualityResult;
    }

    // Step 2: Enrich descriptions from Sandre
    if (step === 'all' || step === 'sandre') {
      const sandreResult = await enrichAllSpotsFromSandre({ departement });
      results.sandre = sandreResult;
    }

    // Step 3: Update water categories from Sandre WFS (regulatory data)
    if (step === 'all' || step === 'categories') {
      const whereClause: Record<string, unknown> = {
        status: 'APPROVED',
        dataOrigin: { not: 'USER' },
      };
      if (departement) whereClause.department = departement;

      const spots = await prisma.spot.findMany({
        where: whereClause,
        select: { id: true, latitude: true, longitude: true },
        take: 500,
      });

      const categoriesUpdated = await updateCategoriesFromSandre(spots);
      results.categories = { updated: categoriesUpdated, processed: spots.length };
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Enrich spots cron error:', error);
    return NextResponse.json(
      { error: 'Enrichment failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
