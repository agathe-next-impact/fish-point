import { useQuery } from '@tanstack/react-query';
import type { SpotImageData } from '@/types/spot';

async function fetchExternalImages(spotId: string): Promise<SpotImageData[]> {
  const res = await fetch(`/api/spots/${spotId}/external-images`);
  if (!res.ok) throw new Error('Failed to fetch external images');
  const json = await res.json();
  return json.data;
}

export function useExternalImages(spotId: string | null) {
  return useQuery({
    queryKey: ['externalImages', spotId],
    queryFn: () => fetchExternalImages(spotId!),
    enabled: !!spotId,
    staleTime: 5 * 60_000,  // 5 minutes
    gcTime: 30 * 60_000,    // 30 minutes
  });
}
