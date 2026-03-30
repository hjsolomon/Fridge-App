import React, { createContext, useContext, ReactNode } from 'react';
import { useBluetooth } from './useBluetooth';
import { Device } from 'react-native-ble-plx';

interface BluetoothContextType {
  devices: Device[];
  fridgeDevices: Device[];
  scanning: boolean;
  connectedDevice: Device | null;
  bluetoothEnabled: boolean;
  tempCharacteristicData: string | null;
  vaccineCharacteristicData: string | null;
  scan: () => void;
  disconnect: () => void;
  connect: (device: Device) => Promise<Device>;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

export const BluetoothProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    devices,
    fridgeDevices,
    scanning,
    connectedDevice,
    bluetoothEnabled,
    tempCharacteristicData,
    vaccineCharacteristicData,
    scan,
    connect,
      disconnect,
  } = useBluetooth();

  return (
    <BluetoothContext.Provider
      value={{
        devices,
        fridgeDevices,
        scanning,
        connectedDevice,
        bluetoothEnabled,
        tempCharacteristicData,
        vaccineCharacteristicData,
        scan,
        connect,
        disconnect,
      }}
    >
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetoothContext = () => {
  const context = useContext(BluetoothContext);
  if (!context) {
    throw new Error('useBluetoothContext must be used within BluetoothProvider');
  }
  return context;
};