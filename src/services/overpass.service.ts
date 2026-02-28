import type { OverpassElement, OverpassResponse } from '@/types/ingestion';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DELAY_MS = 2000;

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

  // Jetties / piers near water
  node["man_made"="pier"](${b});
  way["man_made"="pier"](${b});
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
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (res.status === 429) {
    // Rate limited — wait and retry once
    await delay(5000);
    const retry = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
