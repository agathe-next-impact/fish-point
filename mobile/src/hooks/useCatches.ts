import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CatchData,
  CatchFilters,
  UserCatchStats,
  ApiResponse,
  PaginatedResponse,
} from '@fish-point/shared';
import type { CatchCreateExtendedInput } from '../api/catches';
import {
  getCatches,
  getCatch,
  createCatch,
  deleteCatch,
  getCatchStats,
} from '../api/catches';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const catchKeys = {
  all: ['catches'] as const,
  lists: () => [...catchKeys.all, 'list'] as const,
  list: (filters?: CatchFilters & { page?: number; limit?: number }) =>
    [...catchKeys.lists(), filters] as const,
  details: () => [...catchKeys.all, 'detail'] as const,
  detail: (id: string) => [...catchKeys.details(), id] as const,
  stats: () => [...catchKeys.all, 'stats'] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch a paginated, filterable list of catches. */
export function useCatches(filters?: CatchFilters & { page?: number; limit?: number }) {
  return useQuery<PaginatedResponse<CatchData>>({
    queryKey: catchKeys.list(filters),
    queryFn: () => getCatches(filters),
  });
}

/** Fetch a single catch by its id. */
export function useCatch(id: string) {
  return useQuery<ApiResponse<CatchData>>({
    queryKey: catchKeys.detail(id),
    queryFn: () => getCatch(id),
    enabled: !!id,
  });
}

/** Fetch aggregated catch statistics for the current user. */
export function useCatchStats() {
  return useQuery<ApiResponse<UserCatchStats>>({
    queryKey: catchKeys.stats(),
    queryFn: () => getCatchStats(),
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a new catch record. */
export function useCreateCatch() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<CatchData>, Error, CatchCreateExtendedInput>({
    mutationFn: (data) => createCatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catchKeys.all });
    },
  });
}

/** Delete an existing catch record. */
export function useDeleteCatch() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: (id) => deleteCatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catchKeys.all });
    },
  });
}
