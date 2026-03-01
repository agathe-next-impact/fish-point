import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import type {
  FishingCard,
  FishingCardCreateInput,
  ApiResponse,
} from '@fish-point/shared';

// ---------------------------------------------------------------------------
// Fishing Cards API
// ---------------------------------------------------------------------------

/** GET /api/fishing-cards – List the current user's fishing cards */
export function getFishingCards(): Promise<ApiResponse<FishingCard[]>> {
  return apiGet<ApiResponse<FishingCard[]>>('/api/fishing-cards');
}

/** GET /api/fishing-cards/{id} – Get a single fishing card */
export function getFishingCard(id: string): Promise<ApiResponse<FishingCard>> {
  return apiGet<ApiResponse<FishingCard>>(`/api/fishing-cards/${id}`);
}

/** POST /api/fishing-cards – Create a new fishing card */
export function createFishingCard(
  data: FishingCardCreateInput,
): Promise<ApiResponse<FishingCard>> {
  return apiPost<ApiResponse<FishingCard>>('/api/fishing-cards', data);
}

/** PATCH /api/fishing-cards/{id} – Update a fishing card */
export function updateFishingCard(
  id: string,
  data: Partial<FishingCardCreateInput>,
): Promise<ApiResponse<FishingCard>> {
  return apiPatch<ApiResponse<FishingCard>>(`/api/fishing-cards/${id}`, data);
}

/** DELETE /api/fishing-cards/{id} – Delete a fishing card */
export function deleteFishingCard(id: string): Promise<ApiResponse<null>> {
  return apiDelete<ApiResponse<null>>(`/api/fishing-cards/${id}`);
}
