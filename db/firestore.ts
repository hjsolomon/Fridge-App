/**
 * firestore.ts
 * -------------
 * Initializes the Firestore client and, in development builds, points it at
 * the local Firebase Emulator Suite instead of production.
 *
 * Emulator host differences:
 * - Android emulator: `10.0.2.2` (loopback alias for the host machine)
 * - iOS simulator / web: `localhost`
 *
 * The exported `db` instance is the configured Firestore client and can be
 * imported directly, though most service files call `firestore()` themselves.
 */

import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

// Guard: ensure Firebase has been configured before continuing.
if (!firestore().app) {
  throw new Error(
    "Firebase not configured. Follow README Firebase setup."
  );
}

const db = firestore();

// In development, redirect Firestore traffic to the local emulator.
if (__DEV__) {
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  firestore().useEmulator(host, 9090);
}

export default db;