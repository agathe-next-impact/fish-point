import type { OverpassElement, OverpassResponse } from '@/types/ingestion';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DELAY_MS = 2000;

// Overpass (Apache/mod_security devant overpass-api.de) renvoie 406 Not Acceptable aux
// requêtes dont le User-Agent est celui par défaut de Node/undici. Vercel tourne sous
// undici → sans cet en-tête, TOUTE ingestion OSM échoue en prod (osmTags jamais peuplés).
// Un UA explicite (étiquette Overpass) débloque les appels. Cf. diagnostic 2026-06-21.
const OVERPASS_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': 'FishSpot/1.0 (+https://fishspot.fr)',
} as const;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

/**
 * Build an Overpass QL query for fishing-related features in a bounding box.
 */
function buildFishingQuery(bbox: BBox): string {
  const b = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  // Délibérément écartés (mesuré dépt 17, Tier 2) :
  //  - waterway=river/canal nommés : ~1300+1100 *segments* OSM par département (un cours
  //    d'eau est fragmenté en multitude de tronçons) → ~2400 quasi-doublons/dept via
  //    `out center`. La capture linéaire exige une dissolution de segments (Tier 4) ; les
  //    rivières sont par ailleurs déjà couvertes par les stations Hub'Eau.
  //  - amenity=parking : volume national non borné (~700 k) → bruit + timeout. Le parking
  //    reste un *attribut* de proximité d'un accès, pas un spot.
  //  - natural=coastline : voies continues couvrant tout le littoral, centroïde non
  //    significatif. L'accès côtier est capté via pier/slipway/breakwater.
  return `
[out:json][timeout:180];
(
  // Explicit fishing spots
  node["leisure"="fishing"](${b});
  way["leisure"="fishing"](${b});
  node["fishing"="yes"](${b});
  way["fishing"="yes"](${b});

  // Named lakes and ponds
  way["natural"="water"]["name"](${b});
  relation["natural"="water"]["name"](${b});

  // Named reservoirs
  way["landuse"="reservoir"]["name"](${b});

  // Infrastructures d'accès (niveau 2 ACCESS_ZONE) — features discrètes, classées par
  // inferKindFromTags puis rattachées au plan d'eau ≤2 km via resolveParentWaterBodyId.
  node["man_made"="pier"](${b});
  way["man_made"="pier"](${b});
  node["leisure"="slipway"](${b});
  way["leisure"="slipway"](${b});
  node["man_made"="breakwater"](${b});
  way["man_made"="breakwater"](${b});
  node["waterway"="access_point"](${b});
  way["waterway"="access_point"](${b});
);
out center tags;
`;
}

/**
 * Query the Overpass API for a given bounding box.
 */
export async function queryOverpass(bbox: BBox): Promise<OverpassElement[]> {
  const query = buildFishingQuery(bbox);

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: OVERPASS_HEADERS,
    body: `data=${encodeURIComponent(query)}`,
  });

  if (res.status === 429) {
    // Rate limited — wait and retry once
    await delay(5000);
    const retry = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: OVERPASS_HEADERS,
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!retry.ok) throw new Error(`Overpass retry failed: ${retry.status}`);
    const data: OverpassResponse = await retry.json();
    return data.elements;
  }

  if (!res.ok) {
    throw new Error(`Overpass error: ${res.status} ${res.statusText}`);
  }

  const data: OverpassResponse = await res.json();
  return data.elements;
}

/**
 * Query Overpass for multiple bboxes with rate limiting.
 */
export async function queryOverpassBatched(
  bboxes: BBox[],
  onBatch: (elements: OverpassElement[], index: number) => Promise<void>,
): Promise<number> {
  let total = 0;

  for (let i = 0; i < bboxes.length; i++) {
    const elements = await queryOverpass(bboxes[i]);
    await onBatch(elements, i);
    total += elements.length;

    if (i < bboxes.length - 1) {
      await delay(DELAY_MS);
    }
  }

  return total;
}
