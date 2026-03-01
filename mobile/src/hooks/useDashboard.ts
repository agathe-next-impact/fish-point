import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@fish-point/shared';
import type {
  CatchBySpeciesItem,
  CatchByWeatherItem,
  CatchByHourItem,
  CatchByBaitItem,
  ProgressionItem,
  DashboardFilters,
} from '../api/dashboard';
import {
  getCatchesBySpecies,
  getCatchesByWeather,
  getCatchesByHour,
  getCatchesByBait,
  getProgression,
} from '../api/dashboard';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const dashboardKeys = {
  all: ['dashboard'] as const,
  bySpecies: (filters?: DashboardFilters) =>
    [...dashboardKeys.all, 'by-species', filters] as const,
  byWeather: (filters?: DashboardFilters) =>
    [...dashboardKeys.all, 'by-weather', filters] as const,
  byHour: (filters?: DashboardFilters) =>
    [...dashboardKeys.all, 'by-hour', filters] as const,
  byBait: (filters?: DashboardFilters) =>
    [...dashboardKeys.all, 'by-bait', filters] as const,
  progression: (filters?: DashboardFilters & { months?: number }) =>
    [...dashboardKeys.all, 'progression', filters] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Catch distribution grouped by species. */
export function useCatchesBySpecies(filters?: DashboardFilters) {
  return useQuery<ApiResponse<CatchBySpeciesItem[]>>({
    queryKey: dashboardKeys.bySpecies(filters),
    queryFn: () => getCatchesBySpecies(filters),
  });
}

/** Catch data correlated with weather conditions. */
export function useCatchesByWeather(filters?: DashboardFilters) {
  return useQuery<ApiResponse<CatchByWeatherItem[]>>({
    queryKey: dashboardKeys.byWeather(filters),
    queryFn: () => getCatchesByWeather(filters),
  });
}

/** Catch distribution by hour of day. */
export function useCatchesByHour(filters?: DashboardFilters) {
  return useQuery<ApiResponse<CatchByHourItem[]>>({
    queryKey: dashboardKeys.byHour(filters),
    queryFn: () => getCatchesByHour(filters),
  });
}

/** Catch distribution grouped by bait type. */
export function useCatchesByBait(filters?: DashboardFilters) {
  return useQuery<ApiResponse<CatchByBaitItem[]>>({
    queryKey: dashboardKeys.byBait(filters),
    queryFn: () => getCatchesByBait(filters),
  });
}

/** Monthly progression of catches over time. */
export function useProgression(filters?: DashboardFilters & { months?: number }) {
  return useQuery<ApiResponse<ProgressionItem[]>>({
    queryKey: dashboardKeys.progression(filters),
    queryFn: () => getProgression(filters),
  });
}
