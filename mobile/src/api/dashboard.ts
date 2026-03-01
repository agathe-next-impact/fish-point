import { apiGet } from './client';
import type { ApiResponse } from '@fish-point/shared';

// ---------------------------------------------------------------------------
// Dashboard response types
// ---------------------------------------------------------------------------

export interface CatchBySpeciesItem {
  speciesId: string;
  speciesName: string;
  count: number;
  avgWeight: number | null;
  maxWeight: number | null;
  avgLength: number | null;
}

export interface CatchByWeatherItem {
  weatherTemp: number | null;
  pressure: number | null;
  windSpeed: number | null;
  cloudCover: number | null;
  weight: number | null;
  length: number | null;
  speciesName: string;
}

export interface CatchByHourItem {
  hour: number;
  count: number;
}

export interface CatchByBaitItem {
  bait: string;
  count: number;
  avgWeight: number;
}

export interface ProgressionItem {
  month: string;
  count: number;
  totalWeight: number;
}

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  spotId?: string;
  speciesId?: string;
}

// ---------------------------------------------------------------------------
// Dashboard API
// ---------------------------------------------------------------------------

/** GET /api/dashboard/catches-by-species */
export function getCatchesBySpecies(
  filters?: DashboardFilters,
): Promise<ApiResponse<CatchBySpeciesItem[]>> {
  return apiGet<ApiResponse<CatchBySpeciesItem[]>>(
    '/api/dashboard/catches-by-species',
    filters as Record<string, unknown>,
  );
}

/** GET /api/dashboard/catches-by-weather */
export function getCatchesByWeather(
  filters?: DashboardFilters,
): Promise<ApiResponse<CatchByWeatherItem[]>> {
  return apiGet<ApiResponse<CatchByWeatherItem[]>>(
    '/api/dashboard/catches-by-weather',
    filters as Record<string, unknown>,
  );
}

/** GET /api/dashboard/catches-by-hour */
export function getCatchesByHour(
  filters?: DashboardFilters,
): Promise<ApiResponse<CatchByHourItem[]>> {
  return apiGet<ApiResponse<CatchByHourItem[]>>(
    '/api/dashboard/catches-by-hour',
    filters as Record<string, unknown>,
  );
}

/** GET /api/dashboard/catches-by-bait */
export function getCatchesByBait(
  filters?: DashboardFilters,
): Promise<ApiResponse<CatchByBaitItem[]>> {
  return apiGet<ApiResponse<CatchByBaitItem[]>>(
    '/api/dashboard/catches-by-bait',
    filters as Record<string, unknown>,
  );
}

/** GET /api/dashboard/progression */
export function getProgression(
  filters?: DashboardFilters & { months?: number },
): Promise<ApiResponse<ProgressionItem[]>> {
  return apiGet<ApiResponse<ProgressionItem[]>>(
    '/api/dashboard/progression',
    filters as Record<string, unknown>,
  );
}
