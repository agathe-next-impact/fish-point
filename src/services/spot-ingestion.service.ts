import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';
import { fetchAllFishStations, fetchAllObservationsForStation } from './hubeau-poisson.service';
import { findNearestStation } from './water.service';
import type { HubeauPoissonStation, HubeauFishObservation, IngestionResult } from '@/types/ingestion';
import type { FishingType } from '@prisma/client';

// Hub'Eau coordinates are in WGS84 (EPSG:4326)
function inferWaterType(station: HubeauPoissonStation): 'RIVER' | 'LAKE' | 'STREAM' {
  const name = (station.libelle_station + ' ' + (station.libelle_entite_hydrographique || '')).toLowerCase();
  if (name.includes('lac') || name.includes('étang') || name.includes('plan d')) return 'LAKE';
  if (name.includes('ruisseau') || name.includes('ru ') || name.includes('torrent')) return 'STREAM';
  return 'RIVER';
}

function inferWaterCategory(station: HubeauPoissonStation): 'FIRST' | 'SECOND' | null {
  // Hub'Eau doesn't provide category directly, but salmonid rivers in mountain departments are usually 1st category
  const mountainDepts = ['01', '03', '04', '05', '06', '07', '09', '11', '15', '25', '26', '38', '39', '43', '46', '48', '63', '64', '65', '66', '73', '74', '2A', '2B'];
  if (mountainDepts.includes(station.code_departement)) return 'FIRST';
  return 'SECOND';
}

function buildSpotName(station: HubeauPoissonStation): string {
  const river = station.libelle_entite_hydrographique || '';
  const commune = station.libelle_commune || '';

  if (river && commune) return `${river} - ${commune}`;
  if (river) return river;
  if (station.libelle_station) return station.libelle_station.trim();
  return `Station ${station.code_station}`;
}

function buildSlug(name: string, stationCode: string): string {
  const base = slugify(name);
  // Append station code suffix to ensure uniqueness
  const suffix = stationCode.replace(/[^a-z0-9]/gi, '').slice(-6).toLowerCase();
  return `${base}-${suffix}`;
}

/**
 * Main ingestion pipeline: discover spots from Hub'Eau Poisson stations.
 */
export async function ingestFishStations(options?: {
  departement?: string;
}): Promise<IngestionResult> {
  const startTime = Date.now();
  const result: IngestionResult = {
    spotsCreated: 0,
    spotsUpdated: 0,
    spotsSkipped: 0,
    observationsAdded: 0,
    errors: [],
    duration: 0,
  };

  // Create ingestion log
  const log = await prisma.ingestionLog.create({
    data: {
      source: 'hubeau_poisson',
      status: 'running',
      metadata: { departement: options?.departement || 'all' },
    },
  });

  try {
    await fetchAllFishStations(async (stations, page) => {
      console.log(`Processing page ${page}: ${stations.length} stations`);

      for (const station of stations) {
        try {
          await processStation(station, result);
        } catch (error) {
          const msg = `Station ${station.code_station}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(msg);
          if (result.errors.length > 100) {
            result.errors.push('Too many errors, stopping collection');
            break;
          }
        }
      }
    }, options?.departement);

    result.duration = Date.now() - startTime;

    // Update log
    await prisma.ingestionLog.update({
      where: { id: log.id },
      data: {
        status: 'completed',
        spotsCreated: result.spotsCreated,
        spotsUpdated: result.spotsUpdated,
        spotsSkipped: result.spotsSkipped,
        completedAt: new Date(),
        metadata: {
          departement: options?.departement || 'all',
          observationsAdded: result.observationsAdded,
          errorCount: result.errors.length,
          duration: result.duration,
        },
      },
    });
  } catch (error) {
    await prisma.ingestionLog.update({
      where: { id: log.id },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });
    throw error;
  }

  return result;
}

async function processStation(
  station: HubeauPoissonStation,
  result: IngestionResult,
): Promise<void> {
  // Skip stations without valid coordinates, code, or department
  if (!station.code_station || !station.latitude || !station.longitude || !station.code_departement) {
    result.spotsSkipped++;
    return;
  }

  // Latitude should be between 41-52 for France, longitude between -5 and 10
  const lat = station.latitude;
  const lon = station.longitude;
  if (lat < 41 || lat > 52 || lon < -5.5 || lon > 10) {
    result.spotsSkipped++;
    return;
  }

  const externalId = `hubeau_poisson_${station.code_station}`;
  const existing = await prisma.spot.findUnique({ where: { externalId } });

  const name = buildSpotName(station);
  const waterType = inferWaterType(station);

  if (existing) {
    // Update with latest data if needed
    await prisma.spot.update({
      where: { id: existing.id },
      data: {
        name,
        waterType,
        commune: station.libelle_commune || existing.commune,
      },
    });
    result.spotsUpdated++;

    // Still refresh observations
    await ingestObservationsForSpot(existing.id, station.code_station, result);
    return;
  }

  // Create new spot
  const slug = buildSlug(name, station.code_station);
  const waterCategory = inferWaterCategory(station);

  // Find nearest hydro station for water level data
  let hydroStationCode: string | null = null;
  try {
    hydroStationCode = await findNearestStation(lat, lon);
  } catch {
    // Non-critical: spot can work without hydro data
  }

  const spot = await prisma.spot.create({
    data: {
      slug,
      name,
      description: `Station de suivi piscicole ${(station.libelle_station || station.code_station).trim()}. Cours d'eau : ${station.libelle_entite_hydrographique || 'non renseigné'}. Commune : ${station.libelle_commune || 'non renseignée'}.`,
      latitude: lat,
      longitude: lon,
      department: station.code_departement,
      commune: station.libelle_commune || null,
      waterType,
      waterCategory,
      fishingTypes: inferFishingTypes(waterType),
      status: 'APPROVED',
      isVerified: true,
      dataOrigin: 'AUTO_HUBEAU',
      externalId,
      externalSource: 'hubeau_poisson',
      hydroStationCode,
    },
  });

  result.spotsCreated++;

  // Ingest fish observations
  await ingestObservationsForSpot(spot.id, station.code_station, result);
}

async function ingestObservationsForSpot(
  spotId: string,
  stationCode: string,
  result: IngestionResult,
): Promise<void> {
  try {
    const observations = await fetchAllObservationsForStation(stationCode);
    if (observations.length === 0) return;

    // Deduplicate: keep latest observation per species
    const latestBySpecies = new Map<string, HubeauFishObservation>();
    for (const obs of observations) {
      const key = obs.code_alternatif_taxon || obs.nom_commun_taxon;
      if (!key) continue;

      const existing = latestBySpecies.get(key);
      if (!existing || obs.date_operation > existing.date_operation) {
        latestBySpecies.set(key, obs);
      }
    }

    // Upsert species observations
    for (const [, obs] of latestBySpecies) {
      const speciesCode = obs.code_alternatif_taxon || obs.nom_commun_taxon;
      if (!speciesCode) continue;

      await prisma.speciesObservation.upsert({
        where: {
          spotId_speciesCode_observationDate: {
            spotId,
            speciesCode,
            observationDate: new Date(obs.date_operation),
          },
        },
        update: {
          count: obs.effectif_lot || null,
          speciesName: obs.nom_commun_taxon,
          scientificName: obs.nom_latin_taxon || null,
        },
        create: {
          spotId,
          speciesCode,
          speciesName: obs.nom_commun_taxon,
          scientificName: obs.nom_latin_taxon || null,
          count: obs.effectif_lot || null,
          observationDate: new Date(obs.date_operation),
          sourceCampaign: obs.code_operation,
        },
      });

      result.observationsAdded++;
    }

    // Also populate SpotSpecies for display (link to FishSpecies if match)
    await linkToFishSpecies(spotId, latestBySpecies);
  } catch {
    // Non-critical: spot exists but without observation details
  }
}

/**
 * Links Hub'Eau observations to existing FishSpecies records for display.
 */
async function linkToFishSpecies(
  spotId: string,
  observations: Map<string, HubeauFishObservation>,
): Promise<void> {
  const allSpecies = await prisma.fishSpecies.findMany();

  for (const [, obs] of observations) {
    const commonName = obs.nom_commun_taxon?.toLowerCase() || '';
    const latinName = obs.nom_latin_taxon?.toLowerCase() || '';

    // Try to match by name
    const match = allSpecies.find((s) => {
      const sName = s.name.toLowerCase();
      const sLatin = s.scientificName?.toLowerCase() || '';
      return (
        commonName.includes(sName) ||
        sName.includes(commonName) ||
        (sLatin && latinName.includes(sLatin)) ||
        (sLatin && sLatin.includes(latinName))
      );
    });

    if (!match) continue;

    // Infer abundance from count
    const count = obs.effectif_lot || 0;
    let abundance: 'RARE' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' = 'MODERATE';
    if (count <= 1) abundance = 'RARE';
    else if (count <= 5) abundance = 'LOW';
    else if (count <= 20) abundance = 'MODERATE';
    else if (count <= 50) abundance = 'HIGH';
    else abundance = 'VERY_HIGH';

    await prisma.spotSpecies.upsert({
      where: { spotId_speciesId: { spotId, speciesId: match.id } },
      update: { abundance },
      create: { spotId, speciesId: match.id, abundance },
    });
  }
}

function inferFishingTypes(waterType: string): FishingType[] {
  switch (waterType) {
    case 'RIVER':
      return ['SPINNING', 'COARSE', 'SHORE'];
    case 'LAKE':
      return ['SPINNING', 'BOAT', 'SHORE'];
    case 'STREAM':
      return ['FLY', 'SPINNING'];
    default:
      return ['SHORE'];
  }
}
