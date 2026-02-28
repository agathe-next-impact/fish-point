'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as feedService from '@/services/feed.service';

export function usePublicFeed(page: number = 1) {
  return useQuery({
    queryKey: ['feed', page],
    queryFn: () => feedService.getFeed({ page }),
  });
}

export function useLikeSharedCatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => feedService.likeSharedCatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useUnlikeSharedCatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => feedService.unlikeSharedCatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useComments(sharedCatchId: string) {
  return useQuery({
    queryKey: ['comments', sharedCatchId],
    queryFn: () => feedService.getComments(sharedCatchId),
    enabled: !!sharedCatchId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sharedCatchId, content }: { sharedCatchId: string; content: string }) =>
      feedService.addComment(sharedCatchId, { content }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.sharedCatchId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useShareCatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ catchId, blurLocation, caption }: { catchId: string; blurLocation?: boolean; caption?: string }) =>
      feedService.shareCatch(catchId, { blurLocation, caption }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
