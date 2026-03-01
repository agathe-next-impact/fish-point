import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserProfile, ApiResponse } from '@fish-point/shared';
import type { AuthResponse, RegisterInput } from '../api/auth';
import { login, register, getProfile } from '../api/auth';
import { useAuthStore } from '../stores/auth.store';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const authKeys = {
  profile: ['auth', 'profile'] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch the current user's profile and keep the auth store in sync. */
export function useProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<ApiResponse<UserProfile>>({
    queryKey: authKeys.profile,
    queryFn: async () => {
      const response = await getProfile();
      if (response.data) {
        setUser(response.data);
      }
      return response;
    },
    enabled: isAuthenticated,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Login with email & password. Updates auth store on success. */
export function useLogin() {
  const { setUser, setToken } = useAuthStore.getState();
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, { email: string; password: string }>({
    mutationFn: ({ email, password }) => login(email, password),
    onSuccess: async (data) => {
      await setToken(data.token);
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: authKeys.profile });
    },
  });
}

/** Register a new account. Updates auth store on success. */
export function useRegister() {
  const { setUser, setToken } = useAuthStore.getState();
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, RegisterInput>({
    mutationFn: (data) => register(data),
    onSuccess: async (data) => {
      await setToken(data.token);
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: authKeys.profile });
    },
  });
}

/** Logout the current user. Clears auth store and query cache. */
export function useLogout() {
  const logoutStore = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await logoutStore();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
