import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import type {
  CatchData,
  CatchCreateInput,
  CatchFilters,
  UserCatchStats,
  ApiResponse,
  PaginatedResponse,
  SharedCatchFeedItem,
} from '@fish-point/shared';

// ---------------------------------------------------------------------------
// Extended input type that includes fields the mobile app sends during
// offline sync and detailed catch logging (matches the server schema).
// ---------------------------------------------------------------------------

export interface CatchCreateExtendedInput extends CatchCreateInput {
  lureType?: string;
  lureColor?: string;
  lureSize?: string;
  rigType?: string;
  hookSize?: string;
  lineWeight?: string;
  catchLatitude?: number;
  catchLongitude?: number;
  windSpeed?: number;
  windDirection?: number;
  cloudCover?: number;
  humidity?: number;
  clientId?: string;
  isPublic?: boolean;
}

export interface ShareCatchInput {
  blurLocation?: boolean;
  caption?: string;
}

export interface SyncResult {
  synced: number;
  skipped: number;
}

// ---------------------------------------------------------------------------
// Catches API
// ---------------------------------------------------------------------------

/** GET /api/catches – Paginated catch list */
export function getCatches(
  filters?: CatchFilters & { page?: number; limit?: number },
): Promise<PaginatedResponse<CatchData>> {
  return apiGet<PaginatedResponse<CatchData>>('/api/catches', filters as Record<string, unknown>);
}

/** GET /api/catches/{id} – Single catch */
export function getCatch(id: string): Promise<ApiResponse<CatchData>> {
  return apiGet<ApiResponse<CatchData>>(`/api/catches/${id}`);
}

/** POST /api/catches – Create a new catch */
export function createCatch(data: CatchCreateExtendedInput): Promise<ApiResponse<CatchData>> {
  return apiPost<ApiResponse<CatchData>>('/api/catches', data);
}

/** PATCH /api/catches/{id} – Update an existing catch */
export function updateCatch(
  id: string,
  data: Partial<CatchCreateExtendedInput>,
): Promise<ApiResponse<CatchData>> {
  return apiPatch<ApiResponse<CatchData>>(`/api/catches/${id}`, data);
}

/** DELETE /api/catches/{id} – Delete a catch */
export function deleteCatch(id: string): Promise<ApiResponse<null>> {
  return apiDelete<ApiResponse<null>>(`/api/catches/${id}`);
}

/** GET /api/catches/stats – Aggregated catch statistics for the current user */
export function getCatchStats(): Promise<ApiResponse<UserCatchStats>> {
  return apiGet<ApiResponse<UserCatchStats>>('/api/catches/stats');
}

/** POST /api/catches/sync – Bulk-sync offline-created catches */
export function syncOfflineCatches(catches: CatchCreateExtendedInput[]): Promise<SyncResult> {
  return apiPost<SyncResult>('/api/catches/sync', { catches });
}

/** POST /api/catches/{id}/share – Share a catch to the community feed */
export function shareCatch(
  id: string,
  data: ShareCatchInput,
): Promise<ApiResponse<SharedCatchFeedItem>> {
  return apiPost<ApiResponse<SharedCatchFeedItem>>(`/api/catches/${id}/share`, data);
}
