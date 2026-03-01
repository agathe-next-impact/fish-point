import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { setOnUnauthorized } from '@/api/client';

// Keep the splash screen visible while we load stored auth
SplashScreen.preventAutoHideAsync();

// ---------------------------------------------------------------------------
// Query client
// ---------------------------------------------------------------------------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

// ---------------------------------------------------------------------------
// Auth guard – redirects based on auth state
// ---------------------------------------------------------------------------

function useProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not signed in -> redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Signed in but still on auth screen -> redirect to tabs
      router.replace('/(tabs)/map');
    }
  }, [isAuthenticated, isLoading, segments]);
}

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------

export default function RootLayout() {
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [appReady, setAppReady] = useState(false);
  const router = useRouter();

  useProtectedRoute();

  // Load stored auth on mount
  useEffect(() => {
    async function prepare() {
      await loadStoredAuth();
      setAppReady(true);
    }
    prepare();
  }, []);

  // Setup unauthorized callback
  useEffect(() => {
    setOnUnauthorized(() => {
      useAuthStore.getState().logout();
      router.replace('/(auth)/login');
    });
  }, []);

  // Hide splash when ready
  useEffect(() => {
    if (appReady && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [appReady, isLoading]);

  if (!appReady || isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="spots/[slug]"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="catches/new"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen name="catches/[id]" />
          <Stack.Screen name="catches/index" />
          <Stack.Screen name="dashboard/index" />
          <Stack.Screen name="alerts/index" />
          <Stack.Screen name="my-spots/index" />
          <Stack.Screen name="regulations/index" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
