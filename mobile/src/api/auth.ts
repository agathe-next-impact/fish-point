import { apiGet, apiPost, apiPatch, setToken } from './client';
import type { UserProfile, ApiResponse } from '@fish-point/shared';

// ---------------------------------------------------------------------------
// Input / response types
// ---------------------------------------------------------------------------

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface UpdateProfileInput {
  name?: string;
  username?: string;
  bio?: string;
  image?: string;
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

/** POST /api/auth/mobile-login – Authenticate with email & password */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiPost<AuthResponse>('/api/auth/mobile-login', { email, password });
  if (res.token) {
    await setToken(res.token);
  }
  return res;
}

/** POST /api/auth/mobile-register – Create a new account */
export async function register(data: RegisterInput): Promise<AuthResponse> {
  const res = await apiPost<AuthResponse>('/api/auth/mobile-register', data);
  if (res.token) {
    await setToken(res.token);
  }
  return res;
}

/** GET /api/users/me – Get the current user profile */
export function getProfile(): Promise<ApiResponse<UserProfile>> {
  return apiGet<ApiResponse<UserProfile>>('/api/users/me');
}

/** PATCH /api/users/me – Update the current user profile */
export function updateProfile(data: UpdateProfileInput): Promise<ApiResponse<UserProfile>> {
  return apiPatch<ApiResponse<UserProfile>>('/api/users/me', data);
}

/** POST /api/auth/push-token – Save a push notification token */
export function savePushToken(token: string): Promise<ApiResponse<{ saved: boolean }>> {
  return apiPost<ApiResponse<{ saved: boolean }>>('/api/auth/push-token', { token });
}
