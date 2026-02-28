import type { FishingGroup, GroupMember, GroupTrip } from '@/types/group';
import type { ApiResponse } from '@/types/api';
import type { CreateGroupInput, UpdateGroupInput, CreateTripInput } from '@/validators/group.schema';

const BASE_URL = '/api/groups';

export async function getMyGroups(): Promise<ApiResponse<FishingGroup[]>> {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error('Failed to fetch groups');
  return res.json();
}

export async function getGroup(id: string): Promise<ApiResponse<FishingGroup>> {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch group');
  return res.json();
}

export async function createGroup(data: CreateGroupInput): Promise<ApiResponse<FishingGroup>> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create group');
  return res.json();
}

export async function updateGroup(id: string, data: UpdateGroupInput): Promise<ApiResponse<FishingGroup>> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update group');
  return res.json();
}

export async function deleteGroup(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete group');
}

export async function joinGroup(inviteCode: string): Promise<ApiResponse<FishingGroup>> {
  const res = await fetch(`${BASE_URL}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteCode }),
  });
  if (!res.ok) throw new Error('Failed to join group');
  return res.json();
}

export async function getGroupMembers(groupId: string): Promise<ApiResponse<GroupMember[]>> {
  const res = await fetch(`${BASE_URL}/${groupId}/members`);
  if (!res.ok) throw new Error('Failed to fetch members');
  return res.json();
}

export async function getGroupTrips(groupId: string): Promise<ApiResponse<GroupTrip[]>> {
  const res = await fetch(`${BASE_URL}/${groupId}/trips`);
  if (!res.ok) throw new Error('Failed to fetch trips');
  return res.json();
}

export async function createTrip(groupId: string, data: CreateTripInput): Promise<ApiResponse<GroupTrip>> {
  const res = await fetch(`${BASE_URL}/${groupId}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create trip');
  return res.json();
}
