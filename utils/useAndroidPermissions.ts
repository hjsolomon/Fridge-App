import { useEffect, useState } from 'react';
import { PermissionsAndroid, Linking } from 'react-native';

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

const isAllGranted = (res: PermissionsAndroidResponse) => {
  return PERMISSIONS_REQUEST.every(permission => {
    return res[permission] === PermissionsAndroid.RESULTS.GRANTED;
  });
};

const hasAnyDenied = (res: PermissionsAndroidResponse) => {
  return PERMISSIONS_REQUEST.some(permission => {
    return res[permission] === PermissionsAndroid.RESULTS.DENIED;
  });
};

export const useAndroidPermissions = (): THook => {
  const [granted, setGranted] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [shouldOpenSettings, setShouldOpenSettings] = useState(false);

  const openSettings = () => {
    Linking.openSettings();
  };

  const requestPermissions = async () => {
    setWaiting(true);
    try {
      const res = await PermissionsAndroid.requestMultiple(PERMISSIONS_REQUEST);
      const allGranted = isAllGranted(res);
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

  return { waiting, granted, shouldOpenSettings, requestPermissions, openSettings };
};
