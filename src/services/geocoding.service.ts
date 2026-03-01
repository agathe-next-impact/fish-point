const MAPBOX_TOKEN = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export interface GeocodingResult {
  placeName: string;
  commune: string | null;
  department: string | null;
  departmentCode: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  if (!MAPBOX_TOKEN) return null;

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place,region,district&country=FR&language=fr&access_token=${MAPBOX_TOKEN}`,
    );

    if (!res.ok) return null;
    const data = await res.json();

    if (!data.features || data.features.length === 0) return null;

    const place = data.features.find((f: { place_type: string[] }) => f.place_type.includes('place'));
    const district = data.features.find((f: { place_type: string[] }) => f.place_type.includes('district'));
    const region = data.features.find((f: { place_type: string[] }) => f.place_type.includes('region'));

    return {
      placeName: data.features[0].place_name,
      commune: place?.text || null,
      department: district?.text || null,
      departmentCode: null,
      region: region?.text || null,
      latitude: lat,
      longitude: lng,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve department code + commune from coordinates using the French gov API (free, no key needed).
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
  if (!MAPBOX_TOKEN) return [];

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=FR&language=fr&limit=5&access_token=${MAPBOX_TOKEN}`,
    );

    if (!res.ok) return [];
    const data = await res.json();

    return data.features.map((f: { place_name: string; center: [number, number]; text: string }) => ({
      placeName: f.place_name,
      commune: f.text,
      department: null,
      departmentCode: null,
      region: null,
      latitude: f.center[1],
      longitude: f.center[0],
    }));
  } catch {
    return [];
  }
}
