import type { FishingCard, FishingCardCreateInput, FishingCardUpdateInput } from '@/types/fishing-card';
import type { ApiResponse } from '@/types/api';

const BASE_URL = '/api/fishing-cards';

export async function getMyFishingCards(): Promise<ApiResponse<FishingCard[]>> {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error('Failed to fetch fishing cards');
  return res.json();
}

export async function getFishingCard(id: string): Promise<ApiResponse<FishingCard>> {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch fishing card');
  return res.json();
}

export async function createFishingCard(data: FishingCardCreateInput): Promise<ApiResponse<FishingCard>> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create fishing card');
  return res.json();
}

export async function updateFishingCard(id: string, data: FishingCardUpdateInput): Promise<ApiResponse<FishingCard>> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update fishing card');
  return res.json();
}

export async function deleteFishingCard(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete fishing card');
}
