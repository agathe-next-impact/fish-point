'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchCatchesByHour,
  fetchCatchesByBait,
  fetchCatchesByWeather,
  fetchCatchesBySpecies,
  fetchProgression,
  type DashboardFilters,
} from '@/services/dashboard.service';

export function useCatchesByHour(filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', 'catches-by-hour', filters],
    queryFn: () => fetchCatchesByHour(filters),
    staleTime: 300000,
  });
}

export function useCatchesByBait(filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', 'catches-by-bait', filters],
    queryFn: () => fetchCatchesByBait(filters),
    staleTime: 300000,
  });
}

export function useCatchesByWeather(filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', 'catches-by-weather', filters],
    queryFn: () => fetchCatchesByWeather(filters),
    staleTime: 300000,
  });
}

export function useCatchesBySpecies(filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', 'catches-by-species', filters],
    queryFn: () => fetchCatchesBySpecies(filters),
    staleTime: 300000,
  });
}

export function useProgression(filters?: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', 'progression', filters],
    queryFn: () => fetchProgression(filters),
    staleTime: 300000,
  });
}
