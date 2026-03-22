import React, { createContext, useContext, ReactNode } from 'react';
import { useBluetooth } from './useBluetooth';
import { Device } from 'react-native-ble-plx';

interface BluetoothContextType {
  connectedDevice: Device | null;
  bluetoothEnabled: boolean;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

export const BluetoothProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { connectedDevice, bluetoothEnabled } = useBluetooth();

  return (
    <BluetoothContext.Provider value={{ connectedDevice, bluetoothEnabled }}>
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