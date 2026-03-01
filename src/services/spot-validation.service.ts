import { prisma } from '@/lib/prisma';
import { findWaterBody, isFishingFriendlyNature, isNegativeNature } from './bdtopo.service';
import { findNearbyICPE } from './georisques.service';
import { checkAgriculturalParcel } from './rpg.service';
import { detectAccessType } from './access-detection.service';
import type { ValidationSignal, ValidationResult } from '@/types/ingestion';

/**
 * Compute the confidence score for a spot.
 * Cross-checks external APIs (BD TOPO, Georisques ICPE, RPG) and internal DB data
 * to determine whether the spot is a real fishing location.
 *
 * Returns a score 0-100 with detailed signal breakdown.
 */
export async function computeConfidenceScore(
  spotId: string,
): Promise<ValidationResult> {
  const spot = await prisma.spot.findUnique({
    where: { id: spotId },
    include: {
      _count: {
        select: {
          speciesObservations: true,
          waterQualityData: true,
          biologicalIndices: true,
        },
      },
    },
  });

  if (!spot) return { confidenceScore: 0, signals: [] };

  const signals: ValidationSignal[] = [];
  const { latitude: lat, longitude: lon } = spot;

  // ─── External API checks (parallel) ─────────────────────────
  const [waterBody, nearbyICPE, rpgResult] = await Promise.all([
    findWaterBody(lat, lon),
    findNearbyICPE(lat, lon),
    checkAgriculturalParcel(lat, lon),
  ]);

  // BD TOPO signals
  if (waterBody.found) {
    if (waterBody.layer === 'plan_d_eau') {
      signals.push({
        source: 'bdtopo',
        signal: 'plan_d_eau_found',
        score: 30,
        details: `${waterBody.name || 'Sans nom'} (${waterBody.nature})`,
      });
    } else {
      signals.push({
        source: 'bdtopo',
        signal: 'surface_hydro_found',
        score: 20,
        details: `${waterBody.name || 'Sans nom'} (${waterBody.nature})`,
      });
    }

    if (waterBody.nature && isFishingFriendlyNature(waterBody.nature)) {
      signals.push({
        source: 'bdtopo',
        signal: 'nature_fishing_friendly',
        score: 10,
        details: waterBody.nature,
      });
    }
    if (waterBody.nature && isNegativeNature(waterBody.nature)) {
      signals.push({
        source: 'bdtopo',
        signal: 'nature_negative',
        score: -30,
        details: waterBody.nature,
      });
    }
  } else {
    signals.push({
      source: 'bdtopo',
      signal: 'no_water_body_found',
      score: -20,
    });
  }

  // Georisques ICPE signals
  if (nearbyICPE.hasLivestock) {
    const names = nearbyICPE.installations
      .filter((i) => i.isLivestock)
      .map((i) => i.name)
      .slice(0, 3)
      .join(', ');
    signals.push({
      source: 'georisques',
      signal: 'livestock_nearby',
      score: -40,
      details: names,
    });
  }

  // RPG signals
  if (rpgResult.isInParcel) {
    signals.push({
      source: 'rpg',
      signal: 'inside_agricultural_parcel',
      score: -20,
      details: rpgResult.cultureLabel,
    });
  }

  // ─── Internal DB signals (no API calls) ──────────────────────

  // SANDRE categorie piscicole
  if (spot.waterCategory) {
    signals.push({
      source: 'sandre',
      signal: 'categorie_piscicole',
      score: 25,
      details: spot.waterCategory,
    });
  }

  // Hub'Eau Poisson observations
  if (spot._count.speciesObservations > 0) {
    signals.push({
      source: 'hubeau',
      signal: 'species_observations',
      score: 25,
      details: `${spot._count.speciesObservations} observations`,
    });
  }

  // Linked monitoring stations
  if (spot.hydroStationCode) {
    signals.push({
      source: 'internal',
      signal: 'hydro_station_linked',
      score: 5,
    });
  }
  if (spot.tempStationCode || spot.hydrobioStationCode) {
    signals.push({
      source: 'internal',
      signal: 'monitoring_station_linked',
      score: 5,
    });
  }

  // Water quality data
  if (spot._count.waterQualityData > 0) {
    signals.push({
      source: 'internal',
      signal: 'water_quality_data',
      score: 5,
    });
  }

  // Data origin bonus
  if (spot.dataOrigin === 'AUTO_HUBEAU') {
    signals.push({
      source: 'internal',
      signal: 'origin_hubeau',
      score: 15,
    });
  }

  // OSM tags
  const osmTags = spot.osmTags as Record<string, string> | null;
  if (osmTags) {
    if (osmTags.fishing === 'yes' || osmTags.leisure === 'fishing') {
      signals.push({
        source: 'osm',
        signal: 'fishing_tagged',
        score: 10,
      });
    }
    const negativeWaterValues = ['wastewater', 'basin', 'drain'];
    if (negativeWaterValues.includes(osmTags.water || '')) {
      signals.push({
        source: 'osm',
        signal: 'wastewater_tag',
        score: -50,
        details: `water=${osmTags.water}`,
      });
    }
  }

  // Compute total
  const rawScore = signals.reduce((sum, s) => sum + s.score, 0);
  const confidenceScore = Math.max(0, Math.min(100, rawScore));

  return { confidenceScore, signals };
}

/**
 * Validate a batch of spots and update their confidence scores.
 * Processes spots that haven't been validated yet (validatedAt IS NULL).
 * Only targets auto-discovered spots (not user-created ones).
 *
 * When autoDecide is true:
 *   - score < 15  → REJECTED
 *   - score > 60  → APPROVED + isVerified
 *   - 15-60       → PENDING (manual review)
 */
export async function validateSpotsBatch(options?: {
  departement?: string;
  batchSize?: number;
  autoDecide?: boolean;
}): Promise<{
  processed: number;
  approved: number;
  rejected: number;
  flagged: number;
}> {
  const batchSize = options?.batchSize ?? 50;
  let processed = 0;
  let approved = 0;
  let rejected = 0;
  let flagged = 0;

  const whereClause: Record<string, unknown> = {
    validatedAt: null,
    dataOrigin: { not: 'USER' },
  };
  if (options?.departement) whereClause.department = options.departement;

  const spots = await prisma.spot.findMany({
    where: whereClause,
    select: { id: true, latitude: true, longitude: true, osmTags: true, confidenceDetails: true },
    take: batchSize,
    orderBy: { createdAt: 'asc' },
  });

  for (const spot of spots) {
    try {
      const result = await computeConfidenceScore(spot.id);

      // Detect access type
      const accessResult = await detectAccessType({
        latitude: spot.latitude,
        longitude: spot.longitude,
        osmTags: spot.osmTags as Record<string, string> | null,
        confidenceDetails: spot.confidenceDetails as { signals?: Array<{ source: string; signal: string }> } | null,
      });

      const updateData: Record<string, unknown> = {
        confidenceScore: result.confidenceScore,
        confidenceDetails: { signals: result.signals },
        validatedAt: new Date(),
        accessType: accessResult.accessType,
        accessDetails: accessResult.accessType ? JSON.parse(JSON.stringify({
          signals: accessResult.signals,
          confidence: accessResult.confidence,
          lastCheckedAt: new Date().toISOString(),
        })) : undefined,
      };

      if (options?.autoDecide) {
        if (result.confidenceScore < 15) {
          updateData.status = 'REJECTED';
          rejected++;
        } else if (result.confidenceScore > 60) {
          updateData.status = 'APPROVED';
          updateData.isVerified = true;
          approved++;
        } else {
          updateData.status = 'PENDING';
          flagged++;
        }
      }

      await prisma.spot.update({
        where: { id: spot.id },
        data: updateData,
      });

      processed++;
    } catch (error) {
      console.error(`Validation failed for spot ${spot.id}:`, error);
    }
  }

  return { processed, approved, rejected, flagged };
}
