import { useQuery } from '@tanstack/react-query';
import type { SpotScore } from '@/types/ingestion';

async function fetchScore(spotId: string): Promise<SpotScore & { label: string; color: string }> {
  const res = await fetch(`/api/spots/${spotId}/score`);
  if (!res.ok) throw new Error('Failed to fetch score');
  const json = await res.json();
  return json.data;
}

export function useFishabilityScore(spotId: string | null) {
  return useQuery({
    queryKey: ['fishabilityScore', spotId],
    queryFn: () => fetchScore(spotId!),
    enabled: !!spotId,
    staleTime: 300_000,     // 5 minutes
    refetchInterval: 600_000, // 10 minutes
  });
}
