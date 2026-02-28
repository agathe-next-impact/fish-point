export interface DashboardFilters {
  speciesId?: string;
  spotId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CatchByHour {
  hour: number;
  count: number;
}

export interface CatchByBait {
  bait: string;
  count: number;
  avgWeight: number;
}

export interface CatchByWeather {
  weatherTemp: number | null;
  pressure: number | null;
  windSpeed: number | null;
  cloudCover: number | null;
  weight: number | null;
  length: number | null;
  speciesName: string;
}

export interface CatchBySpecies {
  speciesId: string;
  speciesName: string;
  count: number;
  avgWeight: number | null;
  maxWeight: number | null;
  avgLength: number | null;
}

export interface ProgressionEntry {
  month: string;
  count: number;
  totalWeight: number;
}

function buildParams(filters?: DashboardFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const str = params.toString();
  return str ? `?${str}` : '';
}

export async function fetchCatchesByHour(filters?: DashboardFilters): Promise<CatchByHour[]> {
  const res = await fetch(`/api/dashboard/catches-by-hour${buildParams(filters)}`);
  if (!res.ok) throw new Error('Failed to fetch catches by hour');
  const json = await res.json();
  return json.data;
}

export async function fetchCatchesByBait(filters?: DashboardFilters): Promise<CatchByBait[]> {
  const res = await fetch(`/api/dashboard/catches-by-bait${buildParams(filters)}`);
  if (!res.ok) throw new Error('Failed to fetch catches by bait');
  const json = await res.json();
  return json.data;
}

export async function fetchCatchesByWeather(filters?: DashboardFilters): Promise<CatchByWeather[]> {
  const res = await fetch(`/api/dashboard/catches-by-weather${buildParams(filters)}`);
  if (!res.ok) throw new Error('Failed to fetch catches by weather');
  const json = await res.json();
  return json.data;
}

export async function fetchCatchesBySpecies(filters?: DashboardFilters): Promise<CatchBySpecies[]> {
  const res = await fetch(`/api/dashboard/catches-by-species${buildParams(filters)}`);
  if (!res.ok) throw new Error('Failed to fetch catches by species');
  const json = await res.json();
  return json.data;
}

export async function fetchProgression(filters?: DashboardFilters): Promise<ProgressionEntry[]> {
  const res = await fetch(`/api/dashboard/progression${buildParams(filters)}`);
  if (!res.ok) throw new Error('Failed to fetch progression');
  const json = await res.json();
  return json.data;
}
