import { useEffect, useState, useCallback } from 'react';
import { Device } from 'react-native-ble-plx';
import { bleManager } from './bleManager';
import { Buffer } from 'buffer';

export function useBluetooth() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [fridgeDevices, setFridgeDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);


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
    setFridgeDevices([]);
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

      if (device?.name?.toLowerCase().includes('fridge')) {
        setFridgeDevices(prev =>
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

  const subscribeToCharacteristic = useCallback(async (
    serviceUUID: string,
    characteristicUUID: string,
    onUpdate?: (value: string) => void,
  ) => {
    if (!connectedDevice) {
      console.warn('No connected device');
      return;
    }

    try {
      console.log(`Subscribing to ${serviceUUID} / ${characteristicUUID}`);
      const subscription = connectedDevice.monitorCharacteristicForService(
        serviceUUID,
        characteristicUUID,
        (error, characteristic) => {
          if (error) {
            console.error('Subscription error:', error);
            return;
          }
          if (!characteristic?.value) return;

          try {
            const decodedValue = Buffer.from(characteristic.value, 'base64');

            let value: string | number;
            if (decodedValue.length === 4) {
              value = decodedValue.readInt32LE(0);
            } else {
              value = decodedValue.toString('utf8');
            }
            onUpdate?.(String(value));
          } catch (decodeError) {
            console.error('Failed to decode characteristic value:', decodeError);
          }
        },
      );

      console.log(`Successfully subscribed to ${characteristicUUID}`);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to characteristic:', error);
      console.error(`Characteristic: ${characteristicUUID}`);
      return null;
    }
  }, [connectedDevice]);

  return {
    devices,
    fridgeDevices,
    scanning,
    connectedDevice,
    scan,
    connect,
    subscribeToCharacteristic,
  };
}
