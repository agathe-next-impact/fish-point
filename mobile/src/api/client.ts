import * as SecureStore from 'expo-secure-store';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const AUTH_TOKEN_KEY = 'auth_token';

// ---------------------------------------------------------------------------
// Unauthorized callback – set by the auth layer so the API client can trigger
// a redirect / logout flow when a 401 is received.
// ---------------------------------------------------------------------------

type UnauthorizedCallback = () => void;
let onUnauthorized: UnauthorizedCallback | null = null;

export function setOnUnauthorized(cb: UnauthorizedCallback) {
  onUnauthorized = cb;
}

// ---------------------------------------------------------------------------
// Token helpers (expo-secure-store)
// ---------------------------------------------------------------------------

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// Query-string serialiser
// Handles primitives, arrays (repeated keys) and nested objects (skipped).
// ---------------------------------------------------------------------------

function serializeParams(params: Record<string, unknown>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
        }
      }
    } else if (typeof value !== 'object') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }

  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

export interface ApiError {
  status: number;
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, unknown>,
): Promise<T> {
  const url = `${BASE_URL}${path}${params ? serializeParams(params) : ''}`;
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Handle 401 – clear token and notify the auth layer
  if (response.status === 401) {
    await clearToken();
    onUnauthorized?.();
    const errorBody = await response.json().catch(() => ({ error: 'Unauthorized' }));
    throw {
      status: 401,
      error: errorBody.error ?? 'Unauthorized',
    } satisfies ApiError;
  }

  // Handle other error status codes
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      error: `Request failed with status ${response.status}`,
    }));
    throw {
      status: response.status,
      error: errorBody.error ?? `Request failed with status ${response.status}`,
      code: errorBody.code,
      details: errorBody.details,
    } satisfies ApiError;
  }

  // 204 No Content or empty body
  const text = await response.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

// ---------------------------------------------------------------------------
// Public HTTP helpers
// ---------------------------------------------------------------------------

export function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  return request<T>('GET', path, undefined, params);
}

export function apiPost<T>(path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
  return request<T>('POST', path, body, params);
}

export function apiPut<T>(path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
  return request<T>('PUT', path, body, params);
}

export function apiPatch<T>(path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
  return request<T>('PATCH', path, body, params);
}

export function apiDelete<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  return request<T>('DELETE', path, undefined, params);
}
