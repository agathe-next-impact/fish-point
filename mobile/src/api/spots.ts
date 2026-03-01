import { apiGet, apiPost } from './client';
import type {
  SpotListItem,
  SpotDetail,
  SpotFilters,
  SpotCreateInput,
  MapBounds,
  PaginatedResponse,
  ApiResponse,
  WeatherData,
  WaterLevelData,
} from '@fish-point/shared';

// ---------------------------------------------------------------------------
// Response types specific to spot endpoints
// ---------------------------------------------------------------------------

export interface SpotReview {
  id: string;
  rating: number;
  comment: string | null;
  fishDensity: number | null;
  cleanliness: number | null;
  tranquility: number | null;
  accessibility: number | null;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
}

export interface SpotScore {
  fishabilityScore: number | null;
  components: Record<string, unknown>;
}

export interface ReviewCreateInput {
  rating: number;
  comment?: string;
  fishDensity?: number;
  cleanliness?: number;
  tranquility?: number;
  accessibility?: number;
}

// ---------------------------------------------------------------------------
// Spots API
// ---------------------------------------------------------------------------

/** GET /api/spots – Paginated, filterable spot list */
export function getSpots(
  filters?: SpotFilters & { page?: number; limit?: number },
): Promise<PaginatedResponse<SpotListItem>> {
  return apiGet<PaginatedResponse<SpotListItem>>('/api/spots', filters as Record<string, unknown>);
}

/** GET /api/spots/{slug} – Single spot by slug */
export function getSpot(slug: string): Promise<ApiResponse<SpotDetail>> {
  return apiGet<ApiResponse<SpotDetail>>(`/api/spots/${slug}`);
}

/** GET /api/spots/bbox – Spots within a bounding box */
export function getSpotsBbox(
  bounds: MapBounds & { limit?: number },
): Promise<ApiResponse<SpotListItem[]>> {
  return apiGet<ApiResponse<SpotListItem[]>>('/api/spots/bbox', bounds as unknown as Record<string, unknown>);
}

/** GET /api/spots/search – Text search for spots */
export function searchSpots(
  query: string,
  limit?: number,
): Promise<ApiResponse<SpotListItem[]>> {
  return apiGet<ApiResponse<SpotListItem[]>>('/api/spots/search', { q: query, limit });
}

/** GET /api/spots/nearby – Spots near a given coordinate */
export function getNearbySpots(
  lat: number,
  lng: number,
  radius?: number,
  limit?: number,
): Promise<ApiResponse<(SpotListItem & { distance: number })[]>> {
  return apiGet<ApiResponse<(SpotListItem & { distance: number })[]>>('/api/spots/nearby', {
    lat,
    lng,
    radius,
    limit,
  });
}

/** GET /api/weather/{spotId} – Current weather for a spot */
export function getSpotWeather(spotId: string): Promise<ApiResponse<WeatherData>> {
  return apiGet<ApiResponse<WeatherData>>(`/api/weather/${spotId}`);
}

/** GET /api/water/{spotId} – Water level data for a spot */
export function getSpotWater(spotId: string): Promise<ApiResponse<WaterLevelData>> {
  return apiGet<ApiResponse<WaterLevelData>>(`/api/water/${spotId}`);
}

/** GET /api/spots/{spotId}/score – Fishability score for a spot */
export function getSpotScore(spotId: string): Promise<ApiResponse<SpotScore>> {
  return apiGet<ApiResponse<SpotScore>>(`/api/spots/${spotId}/score`);
}

/** POST /api/spots/favorites – Toggle favourite status on a spot */
export function toggleFavorite(spotId: string): Promise<ApiResponse<{ favorited: boolean }>> {
  return apiPost<ApiResponse<{ favorited: boolean }>>('/api/spots/favorites', { spotId });
}

/** POST /api/spots – Create a new user-submitted spot */
export function createSpot(data: SpotCreateInput): Promise<ApiResponse<SpotDetail>> {
  return apiPost<ApiResponse<SpotDetail>>('/api/spots', data);
}

/** GET /api/spots/{spotId}/reviews – Reviews for a spot */
export function getSpotReviews(spotId: string): Promise<ApiResponse<SpotReview[]>> {
  return apiGet<ApiResponse<SpotReview[]>>(`/api/spots/${spotId}/reviews`);
}

/** POST /api/spots/{spotId}/reviews – Create a review for a spot */
export function createReview(
  spotId: string,
  data: ReviewCreateInput,
): Promise<ApiResponse<SpotReview>> {
  return apiPost<ApiResponse<SpotReview>>(`/api/spots/${spotId}/reviews`, data);
}
