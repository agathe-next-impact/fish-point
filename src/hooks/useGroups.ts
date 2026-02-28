'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as groupsService from '@/services/groups.service';
import type { CreateGroupInput, CreateTripInput } from '@/validators/group.schema';

export function useMyGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsService.getMyGroups(),
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsService.getGroup(id),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGroupInput) => groupsService.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) => groupsService.joinGroup(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useGroupTrips(groupId: string) {
  return useQuery({
    queryKey: ['group-trips', groupId],
    queryFn: () => groupsService.getGroupTrips(groupId),
    enabled: !!groupId,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: CreateTripInput }) =>
      groupsService.createTrip(groupId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-trips', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['group', variables.groupId] });
    },
  });
}
