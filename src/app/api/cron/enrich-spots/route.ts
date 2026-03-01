import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncQualityForAllSpots } from '@/services/hubeau-qualite.service';
import { enrichAllSpotsFromSandre } from '@/services/sandre.service';
import { updateCategoriesFromSandre } from '@/services/sandre-piscicole.service';
import { fetchBiologicalIndices } from '@/services/hubeau-hydrobio.service';
import { fetchAspeDetailedObservations } from '@/services/hubeau-poisson.service';

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

    // Step 4: Sync biological indices from Hub'Eau Hydrobio
    if (step === 'all' || step === 'hydrobio') {
      const spotsWithHydrobio = await prisma.spot.findMany({
        where: {
          status: 'APPROVED',
          hydrobioStationCode: { not: null },
          ...(departement ? { department: departement } : {}),
        },
        select: { id: true, hydrobioStationCode: true },
        take: 200,
      });

      let bioSynced = 0;
      for (const spot of spotsWithHydrobio) {
        try {
          const indices = await fetchBiologicalIndices(spot.hydrobioStationCode!);
          for (const idx of indices) {
            await prisma.biologicalIndex.upsert({
              where: {
                spotId_indexType_measurementDate: {
                  spotId: spot.id,
                  indexType: idx.indexType,
                  measurementDate: new Date(idx.measurementDate),
                },
              },
              update: { value: idx.value, qualityClass: idx.qualityClass },
              create: {
                spotId: spot.id,
                indexType: idx.indexType,
                value: idx.value,
                qualityClass: idx.qualityClass,
                measurementDate: new Date(idx.measurementDate),
                stationCode: idx.stationCode,
              },
            });
          }
          if (indices.length > 0) bioSynced++;
        } catch {
          // Non-critical
        }
      }
      results.hydrobio = { processed: spotsWithHydrobio.length, synced: bioSynced };
    }

    // Step 5: Enrich observations with Aspe detailed data (avg weight/length)
    if (step === 'all' || step === 'aspe') {
      const spotsWithExtId = await prisma.spot.findMany({
        where: {
          status: 'APPROVED',
          externalId: { not: null },
          dataOrigin: 'AUTO_HUBEAU',
          ...(departement ? { department: departement } : {}),
        },
        select: { id: true, externalId: true },
        take: 200,
      });

      let aspeEnriched = 0;
      for (const spot of spotsWithExtId) {
        try {
          const stationCode = spot.externalId!.replace('hubeau_poisson_', '');
          const detailed = await fetchAspeDetailedObservations(stationCode);
          for (const sp of detailed) {
            if (sp.averageWeight === null && sp.averageLength === null) continue;
            await prisma.speciesObservation.updateMany({
              where: { spotId: spot.id, speciesCode: sp.speciesCode },
              data: {
                averageWeight: sp.averageWeight,
                averageLength: sp.averageLength,
              },
            });
          }
          if (detailed.length > 0) aspeEnriched++;
        } catch {
          // Non-critical
        }
      }
      results.aspe = { processed: spotsWithExtId.length, enriched: aspeEnriched };
    }

    // Step 6: Validate spot confidence (external API cross-checks)
    if (step === 'all' || step === 'validation') {
      const { validateSpotsBatch } = await import('@/services/spot-validation.service');
      const validationResult = await validateSpotsBatch({
        departement,
        batchSize: 100,
        autoDecide: true,
      });
      results.validation = validationResult;
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
