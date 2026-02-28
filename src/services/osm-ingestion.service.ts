import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';
import { queryOverpass } from './overpass.service';
import { getDepartmentBBox, getAllDepartmentCodes } from '@/config/department-bbox';
import type { OverpassElement, IngestionResult } from '@/types/ingestion';
import type { BBox } from './overpass.service';
import type { WaterType, FishingType } from '@prisma/client';

/**
 * Map OSM tags to WaterType enum values.
 */
function inferWaterTypeFromTags(tags: Record<string, string>): WaterType {
  const water = tags.water || '';
  const natural = tags.natural || '';
  const landuse = tags.landuse || '';
  const leisure = tags.leisure || '';
  const manMade = tags.man_made || '';

  if (water === 'lake' || (natural === 'water' && !water)) return 'LAKE';
  if (water === 'pond' || water === 'basin') return 'POND';
  if (water === 'reservoir' || landuse === 'reservoir') return 'RESERVOIR';
  if (water === 'river' || water === 'canal') return 'CANAL';
  if (natural === 'coastline' || water === 'sea') return 'SEA';

  // Fishing spots without explicit water type — infer from context
  if (leisure === 'fishing' || tags.fishing === 'yes') {
    if (manMade === 'pier') return 'LAKE'; // piers are often on lakes/ponds
    return 'LAKE'; // default for generic fishing spots
  }

  if (manMade === 'pier') return 'LAKE';

  return 'LAKE'; // default
}

/**
 * Infer fishing types from water type.
 */
function inferFishingTypes(waterType: WaterType): FishingType[] {
  switch (waterType) {
    case 'RIVER':
      return ['SPINNING', 'COARSE', 'SHORE'];
    case 'LAKE':
      return ['SPINNING', 'BOAT', 'SHORE'];
    case 'POND':
      return ['COARSE', 'SHORE'];
    case 'RESERVOIR':
      return ['SPINNING', 'BOAT', 'SHORE'];
    case 'STREAM':
      return ['FLY', 'SPINNING'];
    case 'CANAL':
      return ['COARSE', 'SHORE'];
    case 'SEA':
      return ['SHORE', 'BOAT', 'SURFCASTING'];
    default:
      return ['SHORE'];
  }
}

/**
 * Build a spot name from OSM tags.
 */
function buildSpotName(element: OverpassElement, department: string): string {
  const tags = element.tags || {};
  const name = tags.name || '';
  const water = tags.water || tags.natural || '';

  if (name) return name;

  // Generate a name based on type
  const typeLabel = water === 'lake' ? 'Lac' :
    water === 'pond' ? 'Étang' :
    water === 'reservoir' ? 'Réservoir' :
    tags.man_made === 'pier' ? 'Jetée' :
    tags.leisure === 'fishing' ? 'Spot de pêche' :
    'Plan d\'eau';

  return `${typeLabel} (${department}-${element.id})`;
}

/**
 * Build a unique slug from the element.
 */
function buildSlug(name: string, elementType: string, elementId: number): string {
  const base = slugify(name);
  return `${base}-osm-${elementType[0]}${elementId}`;
}

/**
 * Extract coordinates from an Overpass element (node or way center).
 */
function extractCoords(element: OverpassElement): { lat: number; lon: number } | null {
  if (element.lat !== undefined && element.lon !== undefined) {
    return { lat: element.lat, lon: element.lon };
  }
  if (element.center) {
    return { lat: element.center.lat, lon: element.center.lon };
  }
  return null;
}

/**
 * Build a description from OSM tags.
 */
function buildDescription(element: OverpassElement, waterType: string): string {
  const tags = element.tags || {};
  const parts: string[] = [];

  if (tags.name) parts.push(tags.name);

  const typeLabels: Record<string, string> = {
    LAKE: 'Lac',
    POND: 'Étang',
    RESERVOIR: 'Réservoir',
    RIVER: 'Rivière',
    STREAM: 'Ruisseau',
    CANAL: 'Canal',
    SEA: 'Mer',
  };
  parts.push(`Type : ${typeLabels[waterType] || waterType}`);

  if (tags.leisure === 'fishing') parts.push('Zone de pêche labellisée OSM');
  if (tags.fishing === 'yes') parts.push('Pêche autorisée');
  if (tags.man_made === 'pier') parts.push('Jetée / ponton');
  if (tags.operator) parts.push(`Gestionnaire : ${tags.operator}`);

  return parts.join('. ') + '.';
}

/**
 * Main ingestion pipeline: discover spots from Overpass (OpenStreetMap).
 */
export async function ingestFromOverpass(options?: {
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

  const log = await prisma.ingestionLog.create({
    data: {
      source: 'overpass_osm',
      status: 'running',
      metadata: { departement: options?.departement || 'all' },
    },
  });

  try {
    const departments = options?.departement
      ? [options.departement]
      : getAllDepartmentCodes();

    for (const dept of departments) {
      const bbox = getDepartmentBBox(dept);
      if (!bbox) {
        result.errors.push(`No bbox for department ${dept}`);
        continue;
      }

      console.log(`[OSM] Processing department ${dept}...`);

      try {
        const elements = await queryOverpass(bbox);
        console.log(`[OSM] Department ${dept}: ${elements.length} elements found`);

        for (const element of elements) {
          try {
            await processElement(element, dept, result);
          } catch (error) {
            const msg = `OSM ${element.type}_${element.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            result.errors.push(msg);
            if (result.errors.length > 200) {
              result.errors.push('Too many errors, stopping');
              break;
            }
          }
        }
      } catch (error) {
        const msg = `Department ${dept} query failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[OSM] ${msg}`);
        result.errors.push(msg);
      }

      // Rate limit between departments
      if (departments.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    result.duration = Date.now() - startTime;

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

async function processElement(
  element: OverpassElement,
  department: string,
  result: IngestionResult,
): Promise<void> {
  const tags = element.tags || {};

  // Skip elements without tags (no useful metadata)
  if (Object.keys(tags).length === 0) {
    result.spotsSkipped++;
    return;
  }

  const coords = extractCoords(element);
  if (!coords) {
    result.spotsSkipped++;
    return;
  }

  // Validate coordinates are within France
  if (coords.lat < 41 || coords.lat > 52 || coords.lon < -5.5 || coords.lon > 10) {
    result.spotsSkipped++;
    return;
  }

  const externalId = `osm_${element.type}_${element.id}`;
  const existing = await prisma.spot.findUnique({ where: { externalId } });

  const waterType = inferWaterTypeFromTags(tags);
  const name = buildSpotName(element, department);

  if (existing) {
    // Update existing spot
    await prisma.spot.update({
      where: { id: existing.id },
      data: {
        name,
        waterType,
      },
    });
    result.spotsUpdated++;
    return;
  }

  // Create new spot
  const slug = buildSlug(name, element.type, element.id);

  await prisma.spot.create({
    data: {
      slug,
      name,
      description: buildDescription(element, waterType),
      latitude: coords.lat,
      longitude: coords.lon,
      department,
      waterType,
      waterCategory: null,
      fishingTypes: inferFishingTypes(waterType),
      status: 'APPROVED',
      isVerified: false,
      dataOrigin: 'AUTO_OSM',
      externalId,
      externalSource: 'overpass_osm',
    },
  });

  result.spotsCreated++;
}
