import { useEffect, useState } from 'react';
import { Device } from 'react-native-ble-plx';
import { bleManager } from './bleManager';

export function useBluetooth() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

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
          prev.some(d => d.id === device.id) ? prev : [...prev, device]
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

  return {
    devices,
    scanning,
    connectedDevice,
    scan,
    connect,
  };
}