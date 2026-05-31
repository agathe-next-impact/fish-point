import { searchSpots } from '@/services/spots.service';

export { searchSpots };

export async function getSuggestions(query: string): Promise<string[]> {
  if (query.length < 2) return [];

  try {
    const response = await searchSpots(query, 5);
    return response.data?.map((spot) => spot.name) || [];
  } catch {
    return [];
  }
}
