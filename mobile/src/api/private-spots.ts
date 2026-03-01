import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import type {
  PrivateSpot,
  PrivateSpotSummary,
  PrivateSpotVisit,
  MapBounds,
  ApiResponse,
  PaginatedResponse,
} from '@fish-point/shared';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface PrivateSpotCreateInput {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  color?: string;
  icon?: string;
  notes?: string;
  tags?: string[];
}

export interface PrivateSpotUpdateInput {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  color?: string;
  icon?: string;
  notes?: string;
  tags?: string[];
}

export interface VisitCreateInput {
  notes?: string;
  rating?: number;
  conditions?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Private Spots API
// ---------------------------------------------------------------------------

/** GET /api/private-spots – Paginated list of the user's private spots */
export function getPrivateSpots(
  page?: number,
  limit?: number,
): Promise<PaginatedResponse<PrivateSpotSummary>> {
  return apiGet<PaginatedResponse<PrivateSpotSummary>>('/api/private-spots', { page, limit });
}

/** GET /api/private-spots/{id} – Get a single private spot with visits */
export function getPrivateSpot(id: string): Promise<ApiResponse<PrivateSpot>> {
  return apiGet<ApiResponse<PrivateSpot>>(`/api/private-spots/${id}`);
}

/** POST /api/private-spots – Create a new private spot */
export function createPrivateSpot(
  data: PrivateSpotCreateInput,
): Promise<ApiResponse<PrivateSpot>> {
  return apiPost<ApiResponse<PrivateSpot>>('/api/private-spots', data);
}

/** PATCH /api/private-spots/{id} – Update a private spot */
export function updatePrivateSpot(
  id: string,
  data: PrivateSpotUpdateInput,
): Promise<ApiResponse<PrivateSpot>> {
  return apiPatch<ApiResponse<PrivateSpot>>(`/api/private-spots/${id}`, data);
}

/** DELETE /api/private-spots/{id} – Delete a private spot */
export function deletePrivateSpot(id: string): Promise<ApiResponse<null>> {
  return apiDelete<ApiResponse<null>>(`/api/private-spots/${id}`);
}

/** GET /api/private-spots/bbox – Private spots within a bounding box */
export function getPrivateSpotsBbox(
  bounds: MapBounds,
): Promise<ApiResponse<PrivateSpotSummary[]>> {
  return apiGet<ApiResponse<PrivateSpotSummary[]>>(
    '/api/private-spots/bbox',
    bounds as unknown as Record<string, unknown>,
  );
}

/** GET /api/private-spots/{id}/visits – List visits for a private spot */
export function getPrivateSpotVisits(id: string): Promise<ApiResponse<PrivateSpotVisit[]>> {
  return apiGet<ApiResponse<PrivateSpotVisit[]>>(`/api/private-spots/${id}/visits`);
}

/** POST /api/private-spots/{id}/visits – Log a visit to a private spot */
export function createPrivateSpotVisit(
  id: string,
  data: VisitCreateInput,
): Promise<ApiResponse<PrivateSpotVisit>> {
  return apiPost<ApiResponse<PrivateSpotVisit>>(`/api/private-spots/${id}/visits`, data);
}
