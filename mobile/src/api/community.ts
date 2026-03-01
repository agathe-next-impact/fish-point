import { apiGet, apiPost, apiDelete } from './client';
import type {
  SharedCatchFeedItem,
  SharedCatchComment,
  FishingGroup,
  GroupTrip,
  ApiResponse,
  PaginatedResponse,
} from '@fish-point/shared';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateGroupInput {
  name: string;
  description?: string;
}

export interface CreateGroupTripInput {
  title: string;
  description?: string;
  spotId?: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Feed API
// ---------------------------------------------------------------------------

/** GET /api/feed – Paginated community feed */
export function getFeed(
  page?: number,
  limit?: number,
): Promise<PaginatedResponse<SharedCatchFeedItem>> {
  return apiGet<PaginatedResponse<SharedCatchFeedItem>>('/api/feed', { page, limit });
}

/** POST /api/feed/{id}/like – Like a feed item (toggle) */
export function likeFeedItem(id: string): Promise<ApiResponse<{ liked: boolean }>> {
  return apiPost<ApiResponse<{ liked: boolean }>>(`/api/feed/${id}/like`);
}

/** DELETE /api/feed/{id}/like – Unlike a feed item */
export function unlikeFeedItem(id: string): Promise<ApiResponse<{ liked: boolean }>> {
  return apiDelete<ApiResponse<{ liked: boolean }>>(`/api/feed/${id}/like`);
}

/** GET /api/feed/{id}/comments – Comments on a feed item */
export function getFeedComments(id: string): Promise<ApiResponse<SharedCatchComment[]>> {
  return apiGet<ApiResponse<SharedCatchComment[]>>(`/api/feed/${id}/comments`);
}

/** POST /api/feed/{id}/comments – Add a comment to a feed item */
export function addFeedComment(
  id: string,
  content: string,
): Promise<ApiResponse<SharedCatchComment>> {
  return apiPost<ApiResponse<SharedCatchComment>>(`/api/feed/${id}/comments`, { content });
}

// ---------------------------------------------------------------------------
// Groups API
// ---------------------------------------------------------------------------

/** GET /api/groups – List groups the current user belongs to */
export function getGroups(): Promise<ApiResponse<FishingGroup[]>> {
  return apiGet<ApiResponse<FishingGroup[]>>('/api/groups');
}

/** GET /api/groups/{id} – Get group details (members, trips) */
export function getGroup(id: string): Promise<ApiResponse<FishingGroup>> {
  return apiGet<ApiResponse<FishingGroup>>(`/api/groups/${id}`);
}

/** POST /api/groups – Create a new fishing group */
export function createGroup(data: CreateGroupInput): Promise<ApiResponse<FishingGroup>> {
  return apiPost<ApiResponse<FishingGroup>>('/api/groups', data);
}

/** POST /api/groups/join – Join a group using an invite code */
export function joinGroup(inviteCode: string): Promise<ApiResponse<FishingGroup>> {
  return apiPost<ApiResponse<FishingGroup>>('/api/groups/join', { inviteCode });
}

/** GET /api/groups/{id}/trips – List trips for a group */
export function getGroupTrips(id: string): Promise<ApiResponse<GroupTrip[]>> {
  return apiGet<ApiResponse<GroupTrip[]>>(`/api/groups/${id}/trips`);
}

/** POST /api/groups/{id}/trips – Create a trip in a group */
export function createGroupTrip(
  id: string,
  data: CreateGroupTripInput,
): Promise<ApiResponse<GroupTrip>> {
  return apiPost<ApiResponse<GroupTrip>>(`/api/groups/${id}/trips`, data);
}
