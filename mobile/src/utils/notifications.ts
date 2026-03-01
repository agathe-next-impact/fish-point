import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { savePushToken } from '../api/auth';

// ---------------------------------------------------------------------------
// Notification handler – determines how incoming notifications are displayed
// when the app is in the foreground.
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Request push-notification permissions, obtain the Expo push token and
 * persist it on the backend.
 *
 * Returns the token string on success or `null` when running in the
 * simulator / when the user declines the permission prompt.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications are not supported on simulators / emulators.
  if (!Device.isDevice) {
    console.warn('[notifications] Push notifications require a physical device.');
    return null;
  }

  // Check (and optionally request) permission.
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[notifications] Permission not granted.');
    return null;
  }

  // Obtain the Expo push token.
  // `projectId` is read from app.json -> expo.extra.eas.projectId at build
  // time, but can also be provided explicitly here.
  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  const token = tokenResponse.data;

  // Persist on the backend so the server can target this device.
  try {
    await savePushToken(token);
  } catch (error) {
    console.error('[notifications] Failed to save push token to backend:', error);
  }

  // Android-specific: create a high-priority notification channel.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0369a1',
    });

    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Alertes de peche',
      description: 'Alertes meteo, niveaux d\'eau et conditions de peche',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0369a1',
    });
  }

  return token;
}
