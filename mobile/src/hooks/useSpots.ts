import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  SpotListItem,
  SpotDetail,
  SpotFilters,
  SpotCreateInput,
  MapBounds,
  ApiResponse,
  PaginatedResponse,
} from '@fish-point/shared';
import {
  getSpots,
  getSpot,
  getSpotsBbox,
  getNearbySpots,
  createSpot,
  toggleFavorite,
} from '../api/spots';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const spotKeys = {
  all: ['spots'] as const,
  lists: () => [...spotKeys.all, 'list'] as const,
  list: (filters?: SpotFilters & { page?: number; limit?: number }) =>
    [...spotKeys.lists(), filters] as const,
  details: () => [...spotKeys.all, 'detail'] as const,
  detail: (slug: string) => [...spotKeys.details(), slug] as const,
  map: (bounds: MapBounds & { limit?: number }) =>
    [...spotKeys.all, 'map', bounds] as const,
  nearby: (lat: number, lng: number, radius?: number) =>
    [...spotKeys.all, 'nearby', { lat, lng, radius }] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch a paginated, filterable list of spots. */
export function useSpots(filters?: SpotFilters & { page?: number; limit?: number }) {
  return useQuery<PaginatedResponse<SpotListItem>>({
    queryKey: spotKeys.list(filters),
    queryFn: () => getSpots(filters),
  });
}

/** Fetch a single spot by its slug. */
export function useSpot(slug: string) {
  return useQuery<ApiResponse<SpotDetail>>({
    queryKey: spotKeys.detail(slug),
    queryFn: () => getSpot(slug),
    enabled: !!slug,
  });
}

/** Fetch spots within a bounding box (for the map view). */
export function useMapSpots(bounds: MapBounds & { limit?: number }) {
  return useQuery<ApiResponse<SpotListItem[]>>({
    queryKey: spotKeys.map(bounds),
    queryFn: () => getSpotsBbox(bounds),
    enabled:
      bounds.north !== bounds.south && bounds.east !== bounds.west,
  });
}

/** Fetch spots near a given coordinate. */
export function useNearbySpots(lat: number, lng: number, radius?: number) {
  return useQuery<ApiResponse<(SpotListItem & { distance: number })[]>>({
    queryKey: spotKeys.nearby(lat, lng, radius),
    queryFn: () => getNearbySpots(lat, lng, radius),
    enabled: lat !== 0 && lng !== 0,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a new user-submitted spot. */
export function useCreateSpot() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<SpotDetail>, Error, SpotCreateInput>({
    mutationFn: (data) => createSpot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: spotKeys.all });
    },
  });
}

/** Toggle a spot's favourite status with optimistic update. */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  type Context = {
    previousSpots: [queryKey: readonly unknown[], data: PaginatedResponse<SpotListItem> | undefined][];
  };

  return useMutation<
    ApiResponse<{ favorited: boolean }>,
    Error,
    string,
    Context
  >({
    mutationFn: (spotId) => toggleFavorite(spotId),

    onMutate: async (_spotId) => {
      await queryClient.cancelQueries({ queryKey: spotKeys.all });

      const previousSpots = queryClient.getQueriesData<PaginatedResponse<SpotListItem>>({
        queryKey: spotKeys.lists(),
      });

      return { previousSpots };
    },

    onError: (_error, _spotId, context) => {
      if (context?.previousSpots) {
        for (const [key, data] of context.previousSpots) {
          if (data) {
            queryClient.setQueryData(key, data);
          }
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: spotKeys.all });
    },
  });
}
