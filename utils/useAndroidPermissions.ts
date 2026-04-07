/**
 * useAndroidPermissions.ts
 * -------------------------
 * Custom hook that manages Android runtime permissions required for BLE scanning.
 *
 * Required permissions:
 * - `ACCESS_FINE_LOCATION`  — needed for BLE device discovery on Android ≤12.
 * - `BLUETOOTH_CONNECT`     — needed to connect to BLE devices (Android 12+).
 * - `BLUETOOTH_SCAN`        — needed to scan for BLE devices (Android 12+).
 *
 * The hook re-checks permissions whenever the app returns to the foreground
 * (via AppState listener), so the UI updates automatically if the user grants
 * permissions from the system Settings screen.
 */

import { useEffect, useState } from 'react';
import {
  PermissionsAndroid,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';

/**
 * THook
 * ------
 * Return type of the `useAndroidPermissions` hook.
 *
 * @prop waiting             - `true` while the permission request dialog is open.
 * @prop granted             - `true` when all required permissions have been granted.
 * @prop shouldOpenSettings  - `true` when the user has permanently denied a permission
 *                             and must grant it manually via system Settings.
 * @prop requestPermissions  - Triggers the Android permission request dialog.
 * @prop openSettings        - Opens the app's system Settings page.
 */
type THook = {
  waiting: boolean;
  granted: boolean;
  shouldOpenSettings: boolean;
  requestPermissions: () => Promise<void>;
  openSettings: () => void;
};

/** Typed map of permission name → result string returned by PermissionsAndroid. */
interface PermissionsAndroidResponse {
  [key: string]: string;
}

/** The set of Android permissions this hook manages. */
const PERMISSIONS_REQUEST = [
  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
];

/**
 * hasAnyDenied
 * -------------
 * Returns `true` if any of the managed permissions have a `DENIED` result,
 * meaning the user saw the dialog but explicitly rejected it (not "don't ask again").
 *
 * @param res - The response map from `PermissionsAndroid.requestMultiple`.
 */
const hasAnyDenied = (res: PermissionsAndroidResponse) => {
  for (let i = 0; i < PERMISSIONS_REQUEST.length; i++) {
    if (res[PERMISSIONS_REQUEST[i]] === PermissionsAndroid.RESULTS.DENIED) {
      return true;
    }
  }
  return false;
};

/**
 * useAndroidPermissions
 * ----------------------
 * Hook that checks, requests, and tracks the Android permissions needed for BLE.
 *
 * On mount it performs an initial permission check and sets up an AppState
 * listener to re-check whenever the app becomes active (e.g., returning from
 * the system Settings screen). Returns controls and state the UI can bind to.
 *
 * @returns `THook` — permission state and control functions.
 */
export const useAndroidPermissions = (): THook => {
  const [granted, setGranted] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [shouldOpenSettings, setShouldOpenSettings] = useState(false);

  const checkPermissions = async () => {
    const bluetoothGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    );

    const locationGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (locationGranted && bluetoothGranted) {
      setGranted(true);
    } else {
      setGranted(false);
    }
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  useEffect(() => {
    checkPermissions();

    const subscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') {
          checkPermissions();
        }
      },
    );

    return () => subscription.remove();
  }, []);

  const requestPermissions = async () => {
    setWaiting(true);
    try {
      const res = await PermissionsAndroid.requestMultiple(PERMISSIONS_REQUEST);
      const allGranted = !hasAnyDenied(res);
      setGranted(allGranted);

      // If not all granted and no dialog was shown (user denied with "don't ask again")
      if (!allGranted && !hasAnyDenied(res)) {
        setShouldOpenSettings(true);
      } else {
        setShouldOpenSettings(false);
      }
    } catch (err) {
      console.warn(err);
      setGranted(false);
      setShouldOpenSettings(false);
    } finally {
      setWaiting(false);
    }
  };

  return {
    waiting,
    granted,
    shouldOpenSettings,
    requestPermissions,
    openSettings,
  };
};
