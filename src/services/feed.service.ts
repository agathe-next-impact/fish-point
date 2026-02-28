import type { SharedCatchFeedItem, SharedCatchComment } from '@/types/feed';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

const BASE_URL = '/api/feed';

export async function getFeed(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResponse<SharedCatchFeedItem>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const res = await fetch(`${BASE_URL}?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch feed');
  return res.json();
}

export async function likeSharedCatch(id: string): Promise<ApiResponse<{ liked: boolean }>> {
  const res = await fetch(`${BASE_URL}/${id}/like`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to like');
  return res.json();
}

export async function unlikeSharedCatch(id: string): Promise<ApiResponse<{ liked: boolean }>> {
  const res = await fetch(`${BASE_URL}/${id}/like`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to unlike');
  return res.json();
}

export async function getComments(sharedCatchId: string): Promise<ApiResponse<SharedCatchComment[]>> {
  const res = await fetch(`${BASE_URL}/${sharedCatchId}/comments`);
  if (!res.ok) throw new Error('Failed to fetch comments');
  return res.json();
}

export async function addComment(
  sharedCatchId: string,
  data: { content: string },
): Promise<ApiResponse<SharedCatchComment>> {
  const res = await fetch(`${BASE_URL}/${sharedCatchId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add comment');
  return res.json();
}

export async function shareCatch(
  catchId: string,
  data: { blurLocation?: boolean; caption?: string },
): Promise<ApiResponse<SharedCatchFeedItem>> {
  const res = await fetch(`/api/catches/${catchId}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to share catch');
  return res.json();
}
