import { useEffect, useState } from 'react';
import {
  PermissionsAndroid,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';

type THook = {
  waiting: boolean;
  granted: boolean;
  shouldOpenSettings: boolean;
  requestPermissions: () => Promise<void>;
  openSettings: () => void;
};

interface PermissionsAndroidResponse {
  [key: string]: string;
}

const PERMISSIONS_REQUEST = [
  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
];


const hasAnyDenied = (res: PermissionsAndroidResponse) => {
  for (let i = 0; i < PERMISSIONS_REQUEST.length; i++) {
    if (res[PERMISSIONS_REQUEST[i]] === PermissionsAndroid.RESULTS.DENIED) {
      return true;
    }
  }
  return false;
};

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
