import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type {
  SharedCatchFeedItem,
  SharedCatchComment,
  FishingGroup,
  ApiResponse,
  PaginatedResponse,
} from '@fish-point/shared';
import type { CreateGroupInput } from '../api/community';
import {
  getFeed,
  likeFeedItem,
  getFeedComments,
  addFeedComment,
  getGroups,
  getGroup,
  createGroup,
  joinGroup,
} from '../api/community';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const communityKeys = {
  feed: ['feed'] as const,
  feedList: (page?: number) => [...communityKeys.feed, page] as const,
  feedComments: (id: string) => [...communityKeys.feed, 'comments', id] as const,
  groups: ['groups'] as const,
  groupList: () => [...communityKeys.groups, 'list'] as const,
  groupDetail: (id: string) => [...communityKeys.groups, 'detail', id] as const,
};

// ---------------------------------------------------------------------------
// Feed queries
// ---------------------------------------------------------------------------

/** Fetch paginated community feed with infinite scrolling support. */
export function useFeed() {
  return useInfiniteQuery<PaginatedResponse<SharedCatchFeedItem>>({
    queryKey: communityKeys.feed,
    queryFn: ({ pageParam }) => getFeed(pageParam as number, 20),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined,
  });
}

/** Like / unlike a feed item (toggle). */
export function useLikeFeedItem() {
  const queryClient = useQueryClient();

  type FeedContext = {
    previousFeed: [queryKey: readonly unknown[], data: PaginatedResponse<SharedCatchFeedItem> | undefined][];
  };

  return useMutation<ApiResponse<{ liked: boolean }>, Error, string, FeedContext>({
    mutationFn: (id) => likeFeedItem(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: communityKeys.feed });

      const previousFeed = queryClient.getQueriesData<PaginatedResponse<SharedCatchFeedItem>>({
        queryKey: communityKeys.feed,
      });

      queryClient.setQueriesData<PaginatedResponse<SharedCatchFeedItem>>(
        { queryKey: communityKeys.feed },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((item) => {
              if (item.id !== id) return item;
              const liked = !item.isLikedByMe;
              return {
                ...item,
                isLikedByMe: liked,
                _count: {
                  ...item._count,
                  likes: item._count.likes + (liked ? 1 : -1),
                },
              };
            }),
          };
        },
      );

      return { previousFeed };
    },

    onError: (_error, _id, context) => {
      if (context?.previousFeed) {
        for (const [key, data] of context.previousFeed) {
          if (data) queryClient.setQueryData(key, data);
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.feed });
    },
  });
}

/** Fetch comments for a specific feed item. */
export function useFeedComments(id: string) {
  return useQuery<ApiResponse<SharedCatchComment[]>>({
    queryKey: communityKeys.feedComments(id),
    queryFn: () => getFeedComments(id),
    enabled: !!id,
  });
}

/** Add a comment to a feed item. */
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<SharedCatchComment>,
    Error,
    { feedItemId: string; content: string }
  >({
    mutationFn: ({ feedItemId, content }) => addFeedComment(feedItemId, content),
    onSuccess: (_data, { feedItemId }) => {
      queryClient.invalidateQueries({
        queryKey: communityKeys.feedComments(feedItemId),
      });
      queryClient.invalidateQueries({ queryKey: communityKeys.feed });
    },
  });
}

// ---------------------------------------------------------------------------
// Groups queries
// ---------------------------------------------------------------------------

/** Fetch all groups the current user belongs to. */
export function useGroups() {
  return useQuery<ApiResponse<FishingGroup[]>>({
    queryKey: communityKeys.groupList(),
    queryFn: () => getGroups(),
  });
}

/** Fetch a single group by id (members, trips). */
export function useGroup(id: string) {
  return useQuery<ApiResponse<FishingGroup>>({
    queryKey: communityKeys.groupDetail(id),
    queryFn: () => getGroup(id),
    enabled: !!id,
  });
}

/** Create a new fishing group. */
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<FishingGroup>, Error, CreateGroupInput>({
    mutationFn: (data) => createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.groups });
    },
  });
}

/** Join an existing group using an invite code. */
export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<FishingGroup>, Error, string>({
    mutationFn: (inviteCode) => joinGroup(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.groups });
    },
  });
}
