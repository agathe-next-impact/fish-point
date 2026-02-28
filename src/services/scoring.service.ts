import { prisma } from '@/lib/prisma';
import { calculateFishActivityIndex } from './fish-index.service';
import { fetchWeatherForBatch } from './open-meteo.service';
import { fetchWaterLevelByStation } from './water.service';
import { fetchWaterTemperature } from './hubeau-temperature.service';
import { getFlowStatusForCoords, getFlowScoreImpact } from './hubeau-ecoulement.service';
import type { FlowStatus } from './hubeau-ecoulement.service';
import { findTronconForStation, getVigilanceScoreImpact } from './vigicrues.service';
import { fetchIPRForStation, iprToStaticScoreBonus } from './hubeau-ipr.service';
import { fetchDroughtRestriction, getDroughtScoreImpact } from './vigieau.service';
import { fetchPressureDelta, getPressureDeltaScoreImpact } from './open-meteo-historical.service';
import { computeSolunarData } from './solunar.service';
import { fetchPiezoLevel } from './hubeau-piezometrie.service';
import { ibgnToStaticScoreBonus } from './hubeau-hydrobio.service';
import { fetchFloodForecast, getFloodScoreImpact } from './open-meteo-flood.service';
import SunCalc from 'suncalc';

/**
 * Compute a species-weighted temperature match score for a spot.
 * Returns null if no species with temperature data are linked to the spot.
 */
async function computeSpeciesTemperatureScore(
  spotId: string,
  waterTemperature: number,
): Promise<number | null> {
  const spotSpecies = await prisma.spotSpecies.findMany({
    where: { spotId },
    include: {
      species: {
        select: { optimalTempMin: true, optimalTempMax: true },
      },
    },
  });

  const speciesWithTemp = spotSpecies.filter(
    (ss) => ss.species.optimalTempMin !== null && ss.species.optimalTempMax !== null,
  );

  if (speciesWithTemp.length === 0) return null;

  let totalScore = 0;
  for (const ss of speciesWithTemp) {
    const tMin = ss.species.optimalTempMin!;
    const tMax = ss.species.optimalTempMax!;
    const range = tMax - tMin;

    if (waterTemperature >= tMin && waterTemperature <= tMax) {
      totalScore += 10;
    } else if (waterTemperature >= tMin - range * 0.5 && waterTemperature <= tMax + range * 0.5) {
      totalScore += 5;
    } else if (waterTemperature < 4 || waterTemperature > 32) {
      totalScore -= 10;
    }
  }

  return totalScore / speciesWithTemp.length;
}

/**
 * Check if a month falls within a spawn range (handles year-boundary wrap).
 */
function isInSpawnRange(month: number, start: number, end: number): boolean {
  if (end >= start) return month >= start && month <= end;
  return month >= start || month <= end;
}

/**
 * Compute spawn season bonus for a spot's species.
 * Fish are more active and catchable during their spawning period.
 */
async function computeSpawnSeasonBonus(spotId: string, currentMonth: number): Promise<number> {
  const spotSpecies = await prisma.spotSpecies.findMany({
    where: { spotId },
    include: {
      species: { select: { spawnMonthStart: true, spawnMonthEnd: true } },
    },
  });

  const speciesWithSpawn = spotSpecies.filter(
    (ss) => ss.species.spawnMonthStart !== null && ss.species.spawnMonthEnd !== null,
  );

  if (speciesWithSpawn.length === 0) return 0;

  let spawningCount = 0;
  for (const ss of speciesWithSpawn) {
    if (isInSpawnRange(currentMonth, ss.species.spawnMonthStart!, ss.species.spawnMonthEnd!)) {
      spawningCount++;
    }
  }

  return Math.round((spawningCount / speciesWithSpawn.length) * 8); // max +8pts
}

/**
 * Modulate flow score impact based on dominant feeding type.
 * Carnivores thrive in flowing water; herbivores/cyprinids tolerate stagnant ponds.
 */
async function getSpeciesAwareFlowImpact(spotId: string, flowStatus: FlowStatus): Promise<number> {
  const baseImpact = getFlowScoreImpact(flowStatus);

  const spotSpecies = await prisma.spotSpecies.findMany({
    where: { spotId },
    include: { species: { select: { feedingType: true } } },
  });

  const speciesWithType = spotSpecies.filter((ss) => ss.species.feedingType !== null);
  if (speciesWithType.length === 0) return baseImpact;

  const carnivoreRatio = speciesWithType.filter((ss) => ss.species.feedingType === 'carnivore').length / speciesWithType.length;

  if (flowStatus === 'stagnant') {
    return carnivoreRatio > 0.5 ? -25 : -5;
  }
  if (flowStatus === 'flowing') {
    return carnivoreRatio > 0.5 ? 15 : baseImpact;
  }

  return baseImpact;
}

// Trophy species that anglers seek — boost score
const TROPHY_SPECIES = [
  'brochet', 'sandre', 'truite', 'carpe', 'black bass', 'silure',
  'bar', 'loup', 'dorade', 'saumon', 'ombre',
];

/**
 * Compute the static score for a spot based on species diversity, water quality, etc.
 * Range: 0-100
 */
export async function computeStaticScore(spotId: string): Promise<number> {
  // Get species observations
  const observations = await prisma.speciesObservation.findMany({
    where: { spotId },
    orderBy: { observationDate: 'desc' },
  });

  // Get water quality data
  const qualityData = await prisma.waterQualitySnapshot.findMany({
    where: { spotId },
    orderBy: { measurementDate: 'desc' },
  });

  // Get spot details for IPR lookup + water category
  const spot = await prisma.spot.findUnique({
    where: { id: spotId },
    select: { averageRating: true, externalId: true, waterCategory: true },
  });

  // Get linked species for category matching + O2/pH adjustment
  const spotSpecies = await prisma.spotSpecies.findMany({
    where: { spotId },
    include: {
      species: { select: { category: true, optimalTempMax: true } },
    },
  });

  // Get user reviews for fishDensity (#9)
  const reviews = await prisma.review.findMany({
    where: { spotId },
    select: { fishDensity: true },
  });

  // 1. Species diversity (30%)
  const uniqueSpecies = new Set(observations.map((o) => o.speciesCode));
  const speciesCount = uniqueSpecies.size;
  let diversityScore = 0;
  if (speciesCount >= 10) diversityScore = 100;
  else if (speciesCount >= 7) diversityScore = 80;
  else if (speciesCount >= 4) diversityScore = 60;
  else if (speciesCount >= 2) diversityScore = 40;
  else if (speciesCount >= 1) diversityScore = 20;

  // Bonus: species category matches water domain (#4)
  if (spot?.waterCategory && spotSpecies.length > 0) {
    const matchCount = spotSpecies.filter((ss) => {
      if (spot.waterCategory === 'FIRST' && ss.species.category === 'SALMONID') return true;
      if (spot.waterCategory === 'SECOND' && ss.species.category === 'CYPRINID') return true;
      return false;
    }).length;
    if (matchCount > 0) diversityScore = Math.min(100, diversityScore + matchCount * 5);
  }

  // 2. Trophy species presence (20%)
  let trophyScore = 0;
  for (const obs of observations) {
    const name = obs.speciesName.toLowerCase();
    if (TROPHY_SPECIES.some((t) => name.includes(t))) {
      trophyScore += 20;
    }
  }
  trophyScore = Math.min(100, trophyScore);

  // 3. Observation recency (15%)
  let recencyScore = 0;
  if (observations.length > 0) {
    const latestDate = observations[0].observationDate;
    const yearsAgo = (Date.now() - latestDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (yearsAgo <= 2) recencyScore = 100;
    else if (yearsAgo <= 5) recencyScore = 70;
    else if (yearsAgo <= 10) recencyScore = 40;
    else recencyScore = 20;
  }

  // 4. Water quality (20%) — species-aware thresholds
  let qualityScore = 50;
  if (qualityData.length > 0) {
    let qualityPoints = 0;
    let qualityFactors = 0;

    // Determine species thermal profile for adaptive thresholds (#6, #7)
    const speciesWithTemp = spotSpecies.filter((ss) => ss.species.optimalTempMax !== null);
    const avgOptimalTempMax = speciesWithTemp.length > 0
      ? speciesWithTemp.reduce((s, ss) => s + ss.species.optimalTempMax!, 0) / speciesWithTemp.length
      : null;
    const hasSalmonid = spotSpecies.some((ss) => ss.species.category === 'SALMONID');

    // Dissolved oxygen — adaptive threshold (#6)
    const o2 = qualityData.find((q) => q.parameter === 'dissolved_oxygen');
    if (o2) {
      const o2Threshold = avgOptimalTempMax !== null && avgOptimalTempMax > 22 ? 5.5 : 7.0;
      if (o2.value >= o2Threshold && o2.value <= 12) qualityPoints += 100;
      else if (o2.value >= o2Threshold - 1.5) qualityPoints += 60;
      else qualityPoints += 20;
      qualityFactors++;
    }

    // pH — tighter range for salmonids (#7)
    const ph = qualityData.find((q) => q.parameter === 'ph');
    if (ph) {
      const phMin = hasSalmonid ? 6.8 : 6.5;
      const phMax = hasSalmonid ? 8.0 : 8.5;
      if (ph.value >= phMin && ph.value <= phMax) qualityPoints += 100;
      else if (ph.value >= 6 && ph.value <= 9) qualityPoints += 60;
      else qualityPoints += 20;
      qualityFactors++;
    }

    // Nitrates
    const nitrates = qualityData.find((q) => q.parameter === 'nitrates');
    if (nitrates) {
      if (nitrates.value < 10) qualityPoints += 100;
      else if (nitrates.value < 25) qualityPoints += 70;
      else if (nitrates.value < 50) qualityPoints += 40;
      else qualityPoints += 10;
      qualityFactors++;
    }

    // Ammonium — already stored, now scored (#2)
    const ammonium = qualityData.find((q) => q.parameter === 'ammonium');
    if (ammonium) {
      if (ammonium.value < 0.5) qualityPoints += 100;
      else if (ammonium.value < 1.0) qualityPoints += 60;
      else qualityPoints += 10;
      qualityFactors++;
    }

    // Phosphates — already stored, now scored (#2)
    const phosphates = qualityData.find((q) => q.parameter === 'phosphates');
    if (phosphates) {
      if (phosphates.value < 0.1) qualityPoints += 100;
      else if (phosphates.value < 0.3) qualityPoints += 60;
      else qualityPoints += 20;
      qualityFactors++;
    }

    if (qualityFactors > 0) {
      qualityScore = Math.round(qualityPoints / qualityFactors);
    }
  }

  // 5. User rating (5%) — reduced to make room for fishDensity
  const ratingScore = spot ? (spot.averageRating / 5) * 100 : 0;

  // 6. User fish density rating (5%) (#9)
  let fishDensityScore = 0;
  const reviewsWithDensity = reviews.filter((r) => r.fishDensity !== null);
  if (reviewsWithDensity.length > 0) {
    const avgDensity = reviewsWithDensity.reduce((s, r) => s + r.fishDensity!, 0) / reviewsWithDensity.length;
    fishDensityScore = ((avgDensity - 1) / 4) * 100;
  }

  // 7. IPR ecological index (bonus/penalty applied post-weighting)
  let iprBonus = 0;
  if (spot?.externalId) {
    try {
      const stationCode = spot.externalId.replace('hubeau_poisson_', '');
      const ipr = await fetchIPRForStation(stationCode);
      if (ipr) {
        iprBonus = iprToStaticScoreBonus(ipr.ipr_note, ipr.ipr_code_classe);
      }
    } catch {
      // Non-critical
    }
  }

  // 8. IBGN biological index (bonus/penalty like IPR)
  let ibgnBonus = 0;
  try {
    const bioIndices = await prisma.biologicalIndex.findMany({
      where: { spotId, indexType: 'IBGN' },
      orderBy: { measurementDate: 'desc' },
      take: 1,
    });
    if (bioIndices.length > 0) {
      ibgnBonus = ibgnToStaticScoreBonus(bioIndices[0].qualityClass);
    }
  } catch {
    // Non-critical
  }

  // 9. Regulation penalty (#1) — active bans cap/penalize the score
  let regulationPenalty = 0;
  try {
    const activeRegs = await prisma.spotRegulation.findMany({
      where: { spotId, isActive: true },
      select: { type: true },
    });

    for (const reg of activeRegs) {
      switch (reg.type) {
        case 'PERMANENT_BAN': regulationPenalty = Math.min(regulationPenalty, -50); break;
        case 'POLLUTION_ALERT': regulationPenalty = Math.min(regulationPenalty, -40); break;
        case 'FLOOD_ALERT': regulationPenalty = Math.min(regulationPenalty, -30); break;
        case 'SEASONAL_BAN': regulationPenalty = Math.min(regulationPenalty, -30); break;
        case 'DROUGHT_ALERT': regulationPenalty = Math.min(regulationPenalty, -20); break;
      }
    }
  } catch {
    // Non-critical
  }

  // Weighted combination (30+20+15+20+5+5 = 100%)
  const staticScore = Math.round(
    0.30 * diversityScore +
    0.20 * trophyScore +
    0.15 * recencyScore +
    0.20 * qualityScore +
    0.05 * ratingScore +
    0.05 * fishDensityScore +
    iprBonus +
    ibgnBonus +
    regulationPenalty,
  );

  return Math.max(0, Math.min(100, staticScore));
}

/**
 * Compute the dynamic score for a spot based on current weather and water conditions.
 * Range: 0-100
 */
export async function computeDynamicScore(
  spotId: string,
  lat: number,
  lon: number,
  weatherData?: { pressure: number; windSpeed: number; cloudCover: number; temperature: number; uvIndex?: number; precipitation?: number; precipitationProbability?: number },
  waterLevelTrend?: 'rising' | 'stable' | 'falling',
  waterTemperature?: number,
): Promise<number> {
  const now = new Date();

  // Use solunar data instead of simple moon phase
  const solunar = computeSolunarData(now, lat, lon);
  const moonPhaseValue = solunar.moonPhase;
  let moonPhase = 'other';
  if (moonPhaseValue < 0.05 || moonPhaseValue > 0.95) moonPhase = 'new';
  else if (moonPhaseValue > 0.45 && moonPhaseValue < 0.55) moonPhase = 'full';

  // Use real 48h pressure delta instead of weather code guess
  let pressureTrend: 'rising' | 'stable' | 'falling' = 'stable';
  let pressureDeltaBonus = 0;
  try {
    const delta = await fetchPressureDelta(lat, lon);
    if (delta) {
      pressureDeltaBonus = getPressureDeltaScoreImpact(delta.trend);
      if (delta.delta < -2) pressureTrend = 'falling';
      else if (delta.delta > 2) pressureTrend = 'rising';
    }
  } catch {
    // Fallback to weather code
    if (weatherData) {
      const code = (weatherData as { weatherCode?: number }).weatherCode;
      if (code !== undefined) {
        if (code >= 51 && code <= 82) pressureTrend = 'falling';
        else if (code <= 3) pressureTrend = 'rising';
      }
    }
  }

  const input = {
    pressure: weatherData?.pressure ?? 1013,
    pressureTrend,
    temperature: weatherData?.temperature ?? 15,
    windSpeed: weatherData?.windSpeed ?? 10,
    cloudCover: weatherData?.cloudCover ?? 50,
    moonPhase,
    hourOfDay: now.getHours(),
    month: now.getMonth() + 1,
    waterLevelTrend,
  };

  let score = calculateFishActivityIndex(input).score;

  // Apply 48h pressure delta bonus (replaces the simplistic pressure trend scoring)
  score += pressureDeltaBonus;

  // Solunar period bonus (replaces simple moon phase ±10)
  score += solunar.scoreImpact;

  // UV index impact (±5 points)
  if (weatherData?.uvIndex !== undefined) {
    if (weatherData.uvIndex < 3) score += 5;
    else if (weatherData.uvIndex > 6) score -= 5;
  }

  // Precipitation impact (±8 points)
  if (weatherData?.precipitation !== undefined) {
    if (weatherData.precipitation >= 0.1 && weatherData.precipitation <= 2) score += 8;
    else if (weatherData.precipitation > 5) score -= 5;
  }

  // VigiEau drought restrictions (go/no-go)
  try {
    const drought = await fetchDroughtRestriction(lat, lon);
    if (drought) score += getDroughtScoreImpact(drought.level);
  } catch {
    // Non-critical
  }

  // Water temperature bonus/penalty (±10 points)
  if (waterTemperature !== undefined) {
    try {
      const speciesTempScore = await computeSpeciesTemperatureScore(spotId, waterTemperature);
      if (speciesTempScore !== null) {
        score += speciesTempScore;
      } else {
        if (waterTemperature >= 12 && waterTemperature <= 22) score += 10;
        else if (waterTemperature >= 8 && waterTemperature <= 26) score += 5;
        else if (waterTemperature < 4 || waterTemperature > 30) score -= 10;
      }
    } catch {
      if (waterTemperature >= 12 && waterTemperature <= 22) score += 10;
      else if (waterTemperature >= 8 && waterTemperature <= 26) score += 5;
      else if (waterTemperature < 4 || waterTemperature > 30) score -= 10;
    }
  }

  // Piezometric level (informational — shown in factors but no direct scoring)
  // Handled in score/route.ts for display only

  // Flow status from ONDE network — species-aware
  try {
    const flow = await getFlowStatusForCoords(lat, lon);
    if (flow) score += await getSpeciesAwareFlowImpact(spotId, flow.status);
  } catch {
    // Non-critical
  }

  // Spawn season bonus — fish more active during spawning
  try {
    const currentMonth = now.getMonth() + 1;
    score += await computeSpawnSeasonBonus(spotId, currentMonth);
  } catch {
    // Non-critical
  }

  // Vigicrues flood vigilance (safety factor)
  if (weatherData && (weatherData as { hydroStationCode?: string }).hydroStationCode) {
    try {
      const alert = await findTronconForStation(
        (weatherData as { hydroStationCode?: string }).hydroStationCode!,
      );
      if (alert) score += getVigilanceScoreImpact(alert.level);
    } catch {
      // Non-critical
    }
  }

  // GloFAS flood forecast (7-day river discharge)
  try {
    const flood = await fetchFloodForecast(lat, lon);
    if (flood) score += getFloodScoreImpact(flood.riskLevel);
  } catch {
    // Non-critical
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Compute combined fishability score.
 */
export function computeFishabilityScore(staticScore: number, dynamicScore: number): number {
  return Math.round(0.45 * staticScore + 0.55 * dynamicScore);
}

/**
 * Batch refresh dynamic + combined scores for spots.
 */
export async function refreshDynamicScores(options?: {
  departement?: string;
  batchSize?: number;
}): Promise<{ updated: number }> {
  const batchSize = options?.batchSize ?? 50;
  let updated = 0;

  // Get all approved spots
  const whereClause: Record<string, unknown> = { status: 'APPROVED' };
  if (options?.departement) whereClause.department = options.departement;

  const spots = await prisma.spot.findMany({
    where: whereClause,
    select: {
      id: true,
      latitude: true,
      longitude: true,
      staticScore: true,
      hydroStationCode: true,
      tempStationCode: true,
      piezoStationCode: true,
    },
  });

  // Process in batches
  for (let i = 0; i < spots.length; i += batchSize) {
    const batch = spots.slice(i, i + batchSize);

    // Batch fetch weather
    const weatherMap = await fetchWeatherForBatch(
      batch.map((s) => ({ id: s.id, lat: s.latitude, lon: s.longitude })),
    );

    // Fetch water levels for spots with hydro stations
    const waterLevelMap = new Map<string, 'rising' | 'stable' | 'falling'>();
    const uniqueHydroStations = new Set(batch.map((s) => s.hydroStationCode).filter(Boolean) as string[]);
    for (const stationCode of uniqueHydroStations) {
      try {
        const data = await fetchWaterLevelByStation(stationCode);
        if (data) waterLevelMap.set(stationCode, data.trend);
      } catch {
        // Non-critical
      }
    }

    // Fetch water temperatures for spots with temp stations
    const waterTempMap = new Map<string, number>();
    const uniqueTempStations = new Set(batch.map((s) => s.tempStationCode).filter(Boolean) as string[]);
    for (const stationCode of uniqueTempStations) {
      try {
        const data = await fetchWaterTemperature(stationCode);
        if (data) waterTempMap.set(stationCode, data.temperature);
      } catch {
        // Non-critical
      }
    }

    // Compute scores and update
    for (const spot of batch) {
      try {
        const weather = weatherMap.get(spot.id);
        const waterTrend = spot.hydroStationCode
          ? waterLevelMap.get(spot.hydroStationCode)
          : undefined;
        const waterTemp = spot.tempStationCode
          ? waterTempMap.get(spot.tempStationCode)
          : undefined;

        const weatherWithStation = weather
          ? { ...weather, hydroStationCode: spot.hydroStationCode }
          : undefined;

        const dynamicScore = await computeDynamicScore(
          spot.id,
          spot.latitude,
          spot.longitude,
          weatherWithStation,
          waterTrend,
          waterTemp,
        );

        const staticScore = spot.staticScore ?? 50;
        const fishabilityScore = computeFishabilityScore(staticScore, dynamicScore);

        await prisma.spot.update({
          where: { id: spot.id },
          data: {
            dynamicScore,
            fishabilityScore,
            scoreUpdatedAt: new Date(),
          },
        });

        updated++;
      } catch (error) {
        console.error(`Score refresh failed for spot ${spot.id}:`, error);
      }
    }
  }

  return { updated };
}

/**
 * Batch refresh static scores for spots.
 */
export async function refreshStaticScores(spotIds?: string[]): Promise<{ updated: number }> {
  let updated = 0;

  const spots = spotIds
    ? await prisma.spot.findMany({ where: { id: { in: spotIds } }, select: { id: true, dynamicScore: true } })
    : await prisma.spot.findMany({ where: { status: 'APPROVED' }, select: { id: true, dynamicScore: true } });

  for (const spot of spots) {
    try {
      const staticScore = await computeStaticScore(spot.id);
      const dynamicScore = spot.dynamicScore ?? 50;
      const fishabilityScore = computeFishabilityScore(staticScore, dynamicScore);

      await prisma.spot.update({
        where: { id: spot.id },
        data: {
          staticScore,
          fishabilityScore,
          scoreUpdatedAt: new Date(),
        },
      });

      updated++;
    } catch (error) {
      console.error(`Static score refresh failed for spot ${spot.id}:`, error);
    }
  }

  return { updated };
}
