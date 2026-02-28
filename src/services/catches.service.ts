import type { CatchData, CatchCreateInput, CatchFilters, UserCatchStats } from '@/types/catch';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

const BASE_URL = '/api/catches';

export async function getCatches(
  filters: CatchFilters & { page?: number; limit?: number } = {},
): Promise<PaginatedResponse<CatchData>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch catches');
  return res.json();
}

export async function getCatch(id: string): Promise<ApiResponse<CatchData>> {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch catch');
  return res.json();
}

export async function createCatch(data: CatchCreateInput): Promise<ApiResponse<CatchData>> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create catch');
  return res.json();
}

export async function deleteCatch(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete catch');
}

export async function getUserStats(userId: string): Promise<ApiResponse<UserCatchStats>> {
  const res = await fetch(`/api/users/${userId}/stats`);
  if (!res.ok) throw new Error('Failed to fetch user stats');
  return res.json();
}
