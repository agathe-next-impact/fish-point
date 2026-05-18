/**
 * Geocoding via BAN (Base Adresse Nationale).
 * Public API, no key required, FR-only — https://adresse.data.gouv.fr/api-doc/adresse
 *
 * Migrated from Mapbox Places API in ML-05 (see docs/migration-maplibre.md).
 */

const BAN_BASE_URL = 'https://api-adresse.data.gouv.fr';

export interface GeocodingResult {
  placeName: string;
  commune: string | null;
  department: string | null;
  departmentCode: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
}

interface BanFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    label?: string;
    city?: string;
    name?: string;
    depcode?: string;
    context?: string;
  };
}

interface BanResponse {
  features?: BanFeature[];
}

/**
 * Parse the BAN `context` field into [departmentName, regionName].
 * Example input: "75, Paris, Île-de-France" → ["Paris", "Île-de-France"]
 * The first segment is the department code (also exposed as `depcode`).
 */
function parseContext(context: string | undefined): { department: string | null; region: string | null } {
  if (!context) return { department: null, region: null };
  const parts = context.split(',').map((s) => s.trim());
  return {
    department: parts[1] ?? null,
    region: parts[2] ?? null,
  };
}

function mapFeature(f: BanFeature): GeocodingResult {
  const { department, region } = parseContext(f.properties.context);
  const [longitude, latitude] = f.geometry.coordinates;
  return {
    placeName: f.properties.label ?? f.properties.name ?? '',
    commune: f.properties.city ?? f.properties.name ?? null,
    department,
    departmentCode: f.properties.depcode ?? null,
    region,
    latitude,
    longitude,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  try {
    const res = await fetch(`${BAN_BASE_URL}/reverse/?lon=${lng}&lat=${lat}&type=municipality`);
    if (!res.ok) return null;
    const data = (await res.json()) as BanResponse;
    const feature = data.features?.[0];
    if (!feature) return null;
    return mapFeature(feature);
  } catch {
    return null;
  }
}

/**
 * Resolve department code + commune from coordinates using the French gov API.
 * Kept on `geo.api.gouv.fr` (commune lookup, separate endpoint) — unchanged in ML-05.
 */
export async function resolveDepartment(lat: number, lng: number): Promise<{ departmentCode: string; commune: string } | null> {
  try {
    const res = await fetch(
      `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lng}&fields=codeDepartement,nom&limit=1`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return {
      departmentCode: data[0].codeDepartement,
      commune: data[0].nom,
    };
  } catch {
    return null;
  }
}

export async function geocode(query: string): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const url = `${BAN_BASE_URL}/search/?q=${encodeURIComponent(trimmed)}&limit=5&type=municipality`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as BanResponse;
    return (data.features ?? []).map(mapFeature);
  } catch {
    return [];
  }
}
