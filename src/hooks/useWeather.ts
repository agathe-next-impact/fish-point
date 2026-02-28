'use client';

import { useQuery } from '@tanstack/react-query';
import type { WeatherData } from '@/types/weather';

async function fetchWeather(spotId: string): Promise<WeatherData> {
  const res = await fetch(`/api/weather/${spotId}`);
  if (!res.ok) throw new Error('Failed to fetch weather');
  const json = await res.json();
  return json.data;
}

export function useWeather(spotId: string | null) {
  return useQuery({
    queryKey: ['weather', spotId],
    queryFn: () => fetchWeather(spotId!),
    enabled: !!spotId,
    staleTime: 600000,
    refetchInterval: 900000,
  });
}
