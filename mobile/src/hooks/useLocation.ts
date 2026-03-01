import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

interface UseLocationReturn {
  location: LocationData | null;
  error: string | null;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Watches the device's position using expo-location with moderate accuracy.
 *
 * Permission is **not** requested automatically -- call `requestPermission()`
 * to trigger the OS prompt and start watching.  If foreground permission has
 * already been granted (e.g. from a previous session) watching starts on mount.
 */
export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // -----------------------------------------------------------------------
  // Permission request
  // -----------------------------------------------------------------------

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('Permission de localisation refusee.');
        setIsLoading(false);
        return false;
      }

      setError(null);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur inconnue lors de la demande de permission.';
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, []);

  // -----------------------------------------------------------------------
  // Position watcher
  // -----------------------------------------------------------------------

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function startWatching() {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();

        if (status !== 'granted') {
          setIsLoading(false);
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (loc) => {
            setLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              altitude: loc.coords.altitude,
              accuracy: loc.coords.accuracy,
              heading: loc.coords.heading,
              speed: loc.coords.speed,
              timestamp: loc.timestamp,
            });
            setIsLoading(false);
            setError(null);
          },
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erreur de geolocalisation.';
        setError(message);
        setIsLoading(false);
      }
    }

    startWatching();

    return () => {
      subscription?.remove();
    };
  }, []);

  return { location, error, isLoading, requestPermission };
}
