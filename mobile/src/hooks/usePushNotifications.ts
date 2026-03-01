import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';
import { registerForPushNotifications } from '../utils/notifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The `data` payload we expect from the server when it sends a push
 * notification. The `type` field drives deep-link navigation.
 */
interface NotificationPayload {
  type?:
    | 'spot'
    | 'catch'
    | 'alert'
    | 'community'
    | 'weather';
  /** e.g. spot slug, catch id, etc. */
  id?: string;
  /** Arbitrary extra data the server may attach. */
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Navigation helper
// ---------------------------------------------------------------------------

function navigateFromNotification(
  router: ReturnType<typeof useRouter>,
  payload: NotificationPayload,
): void {
  switch (payload.type) {
    case 'spot':
      if (payload.id) {
        router.push(`/spots/${payload.id}`);
      }
      break;

    case 'catch':
      if (payload.id) {
        router.push(`/catches/${payload.id}`);
      }
      break;

    case 'alert':
      router.push('/alerts');
      break;

    case 'community':
      router.push('/(tabs)/community');
      break;

    case 'weather':
      if (payload.id) {
        router.push(`/spots/${payload.id}`);
      }
      break;

    default:
      // No deep-link target -- do nothing.
      break;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages push notification registration and deep-link handling.
 *
 * - Registers for push notifications on mount when the user is
 *   authenticated.
 * - Listens for notifications received while the app is foregrounded.
 * - Listens for notification taps and navigates to the relevant screen
 *   using expo-router.
 *
 * Place this hook once in the root authenticated layout.
 */
export function usePushNotifications() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasRegistered = useRef(false);

  // -----------------------------------------------------------------------
  // Registration
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!isAuthenticated || hasRegistered.current) return;

    registerForPushNotifications()
      .then((token) => {
        if (token) {
          hasRegistered.current = true;
        }
      })
      .catch((error) => {
        console.error('[usePushNotifications] Registration failed:', error);
      });
  }, [isAuthenticated]);

  // -----------------------------------------------------------------------
  // Foreground notification listener
  // -----------------------------------------------------------------------

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        // The notification is already displayed by the handler configured in
        // notifications.ts.  Log for debugging purposes.
        const data = notification.request.content.data as NotificationPayload | undefined;
        console.log(
          '[usePushNotifications] Notification received in foreground:',
          notification.request.content.title,
          data,
        );
      },
    );

    return () => subscription.remove();
  }, []);

  // -----------------------------------------------------------------------
  // Notification tap (response) listener
  // -----------------------------------------------------------------------

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content
          .data as NotificationPayload | undefined;

        if (data) {
          navigateFromNotification(router, data);
        }
      },
    );

    return () => subscription.remove();
  }, [router]);

  // -----------------------------------------------------------------------
  // Handle the notification that launched the app (cold start)
  // -----------------------------------------------------------------------

  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content
          .data as NotificationPayload | undefined;

        if (data) {
          navigateFromNotification(router, data);
        }
      }
    });
  }, [router]);
}
