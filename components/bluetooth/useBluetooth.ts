import { useEffect, useState } from 'react';
import { Device } from 'react-native-ble-plx';
import { bleManager } from './bleManager';
import { Buffer } from 'buffer';

export function useBluetooth() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    if (!connectedDevice) return;

    const checkConnection = async () => {
      try {
        const isConnected = await connectedDevice.isConnected();
        if (!isConnected) {
          console.warn('Device disconnected');
          setConnectedDevice(null);
        }
      } catch (error) {
        console.warn('Error checking connection:', error);
        setConnectedDevice(null);
      }
    };

    const interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, [connectedDevice]);

  useEffect(() => {
    if (!connectedDevice) return;

    const subscription = connectedDevice.onDisconnected(() => {
      console.warn('Device disconnection event received');
      setConnectedDevice(null);
    });

    return () => subscription.remove();
  }, [connectedDevice]);

  useEffect(() => {
    return () => {
      bleManager.stopDeviceScan();
    };
  }, []);

  const scan = () => {
    setDevices([]);
    setScanning(true);

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.warn('Scan error:', error);
        setScanning(false);
        return;
      }

      if (device?.name) {
        setDevices(prev =>
          prev.some(d => d.id === device.id) ? prev : [...prev, device],
        );
      }
    });

    setTimeout(() => {
      bleManager.stopDeviceScan();
      setScanning(false);
    }, 10000);
  };

  const connect = async (device: Device) => {
    try {
      const connected = await device.connect();
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      return connected;
    } catch (e) {
      console.warn('Connection failed:', e);
      throw e;
    }
  };

  const subscribeToCharacteristic = async (
    serviceUUID: string,
    characteristicUUID: string,
    onUpdate?: (value: string) => void,
  ) => {
    if (!connectedDevice) {
      console.warn('No connected device');
      return;
    }

    try {
      const subscription = connectedDevice.monitorCharacteristicForService(
        serviceUUID,
        characteristicUUID,
        (error, characteristic) => {
          if (error) {
            console.warn('Subscription error:', error);
            return;
          }

          if (!characteristic?.value) {
            return;
          }
          const decodedValue = Buffer.from(characteristic.value, 'base64').toString('utf-8');
          if (onUpdate) {
            onUpdate(decodedValue);
          }
        },
      );

      return subscription;
    } catch (error) {
      console.warn('Failed to subscribe:', error);
    }
  };

  return {
    devices,
    scanning,
    connectedDevice,
    scan,
    connect,
    subscribeToCharacteristic,
  };
}
