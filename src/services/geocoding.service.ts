export interface GeocodingResult {
  placeName: string;
  commune: string | null;
  department: string | null;
  departmentCode: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: NominatimAddress;
}

const NOMINATIM_HEADERS = {
  'User-Agent': 'FishPoint/1.0 (application de spots de pêche)',
  'Accept-Language': 'fr',
};

function parseDepartmentCode(postcode?: string): string | null {
  if (!postcode) return null;
  const code = postcode.replace(/\s/g, '');
  if (code.startsWith('97') || code.startsWith('98')) return code.slice(0, 3);
  return code.slice(0, 2);
}

function parseCommune(address: NominatimAddress): string | null {
  return address.city ?? address.town ?? address.village ?? address.hamlet ?? null;
}

function parseResult(result: NominatimResult, lat: number, lng: number): GeocodingResult {
  return {
    placeName: result.display_name,
    commune: parseCommune(result.address),
    department: result.address.county ?? null,
    departmentCode: parseDepartmentCode(result.address.postcode),
    region: result.address.state ?? null,
    latitude: lat,
    longitude: lng,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return null;
    const data: NominatimResult = await res.json();
    return parseResult(data, lat, lng);
  } catch {
    return null;
  }
}

export async function geocode(query: string): Promise<GeocodingResult[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&countrycodes=fr&limit=5`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return [];
    const data: NominatimResult[] = await res.json();
    return data.map((r) => parseResult(r, parseFloat(r.lat), parseFloat(r.lon)));
  } catch {
    return [];
  }
}
