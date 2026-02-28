import type { SpotCreateInput, SpotUpdateInput, SpotFilters, SpotListItem, SpotDetail, GeoSpotQuery } from '@/types/spot';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

const BASE_URL = '/api/spots';

export async function getSpots(
  filters: SpotFilters & { page?: number; limit?: number } = {},
): Promise<PaginatedResponse<SpotListItem>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, String(v)));
      } else {
        params.set(key, String(value));
      }
    }
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch spots');
  return res.json();
}

export async function getSpotBySlug(slug: string): Promise<ApiResponse<SpotDetail>> {
  const res = await fetch(`${BASE_URL}/${slug}`);
  if (!res.ok) throw new Error('Failed to fetch spot');
  return res.json();
}

export async function createSpot(data: SpotCreateInput): Promise<ApiResponse<SpotDetail>> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create spot');
  return res.json();
}

export async function updateSpot(id: string, data: SpotUpdateInput): Promise<ApiResponse<SpotDetail>> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update spot');
  return res.json();
}

export async function deleteSpot(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete spot');
}

export async function getNearbySpots(query: GeoSpotQuery): Promise<ApiResponse<SpotListItem[]>> {
  const params = new URLSearchParams({
    lat: query.lat.toString(),
    lng: query.lng.toString(),
    radius: query.radius.toString(),
    limit: (query.limit || 50).toString(),
    offset: (query.offset || 0).toString(),
  });

  const res = await fetch(`${BASE_URL}/nearby?${params}`);
  if (!res.ok) throw new Error('Failed to fetch nearby spots');
  return res.json();
}

export async function searchSpots(query: string): Promise<ApiResponse<SpotListItem[]>> {
  const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search spots');
  return res.json();
}
