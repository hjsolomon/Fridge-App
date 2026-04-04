import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';

/**
 * Requests notification permission, registers the device FCM token in
 * Firestore, and keeps the token refreshed. Call once at app startup.
 *
 * Tokens are stored at DeviceTokens/{token} so the Cloud Function can
 * retrieve them when sending temperature alerts.
 */
export const usePushNotifications = () => {
  useEffect(() => {
    const register = async () => {
      // Request permission (required on iOS; Android 13+ also needs this)
      const authStatus = await messaging().requestPermission();
      const granted =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!granted) {
        console.log('Push notification permission not granted.');
        return;
      }

      // Get the FCM token for this device
      const token = await messaging().getToken();
      await saveToken(token);
    };

    register();

    // Re-save token if Firebase rotates it
    const unsubscribeRefresh = messaging().onTokenRefresh(saveToken);

    // Show a local alert when a notification arrives while the app is open
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification:', remoteMessage.notification);
    });

    return () => {
      unsubscribeRefresh();
      unsubscribeForeground();
    };
  }, []);
};

const saveToken = async (token: string) => {
  await firestore().collection('DeviceTokens').doc(token).set({
    token,
    created_at: firestore.FieldValue.serverTimestamp(),
  });
};
