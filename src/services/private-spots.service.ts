import type { PrivateSpot, PrivateSpotSummary, PrivateSpotVisit } from '@/types/private-spot';
import type { PaginatedResponse, ApiResponse } from '@/types/api';
import type { CreatePrivateSpotInput, UpdatePrivateSpotInput, CreateVisitInput } from '@/validators/private-spot.schema';

const BASE_URL = '/api/private-spots';

export async function getMyPrivateSpots(
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<PrivateSpotSummary & { lastVisitDate: string | null }>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch private spots');
  return res.json();
}

export async function getPrivateSpot(id: string): Promise<ApiResponse<PrivateSpot>> {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch private spot');
  return res.json();
}

export async function createPrivateSpot(data: CreatePrivateSpotInput): Promise<ApiResponse<PrivateSpot>> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create private spot');
  return res.json();
}

export async function updatePrivateSpot(id: string, data: UpdatePrivateSpotInput): Promise<ApiResponse<PrivateSpot>> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update private spot');
  return res.json();
}

export async function deletePrivateSpot(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete private spot');
}

export async function getPrivateSpotsBbox(bbox: {
  north: number;
  south: number;
  east: number;
  west: number;
}): Promise<ApiResponse<PrivateSpotSummary[]>> {
  const params = new URLSearchParams({
    north: bbox.north.toString(),
    south: bbox.south.toString(),
    east: bbox.east.toString(),
    west: bbox.west.toString(),
  });

  const res = await fetch(`${BASE_URL}/bbox?${params}`);
  if (!res.ok) throw new Error('Failed to fetch private spots bbox');
  return res.json();
}

export async function logVisit(spotId: string, data: CreateVisitInput): Promise<ApiResponse<PrivateSpotVisit>> {
  const res = await fetch(`${BASE_URL}/${spotId}/visits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to log visit');
  return res.json();
}
