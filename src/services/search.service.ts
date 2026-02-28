import type { SpotListItem } from '@/types/spot';
import type { ApiResponse } from '@/types/api';

export async function searchSpots(query: string): Promise<ApiResponse<SpotListItem[]>> {
  const res = await fetch(`/api/spots/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function getSuggestions(query: string): Promise<string[]> {
  if (query.length < 2) return [];

  const res = await fetch(`/api/spots/search?q=${encodeURIComponent(query)}&limit=5`);
  if (!res.ok) return [];

  const data = await res.json();
  return data.data?.map((s: SpotListItem) => s.name) || [];
}
