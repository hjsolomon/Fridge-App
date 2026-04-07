/**
 * BluetoothContext.tsx
 * ---------------------
 * React context that exposes BLE state and control functions to the component tree.
 *
 * Architecture:
 * - `BluetoothProvider` wraps the app (or a subtree) and delegates all BLE logic
 *   to the `useBluetooth` hook, then publishes the result through context.
 * - `useBluetoothContext` is the consumer hook — any component that needs BLE
 *   data or actions should call this instead of accessing the context directly.
 *
 * Usage:
 * ```tsx
 * // Wrap your navigator:
 * <BluetoothProvider><AppNavigator /></BluetoothProvider>
 *
 * // Inside any child component:
 * const { connectedDevice, scan } = useBluetoothContext();
 * ```
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useBluetooth } from './useBluetooth';
import { Device } from 'react-native-ble-plx';

/**
 * BluetoothContextType
 * ---------------------
 * Shape of the value provided by BluetoothContext.
 *
 * @prop devices                 - All BLE devices discovered during the last scan.
 * @prop fridgeDevices           - Subset of `devices` that match the fridge device filter.
 * @prop scanning                - Whether a BLE scan is currently in progress.
 * @prop connectedDevice         - The currently connected BLE device, or null if disconnected.
 * @prop bluetoothEnabled        - Whether the device's Bluetooth adapter is powered on.
 * @prop tempCharacteristicData  - Latest decoded value from the temperature BLE characteristic.
 * @prop vaccineCharacteristicData - Latest decoded value from the vaccine/inventory BLE characteristic.
 * @prop scan                    - Start a BLE device scan.
 * @prop disconnect              - Disconnect from the currently connected device.
 * @prop connect                 - Connect to a specific BLE device and return it.
 */
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

/**
 * BluetoothProvider
 * ------------------
 * Context provider that initializes BLE logic via `useBluetooth` and makes
 * all BLE state and actions available to descendant components.
 *
 * @param children - React subtree that will have access to Bluetooth context.
 */
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

/**
 * useBluetoothContext
 * --------------------
 * Custom hook for consuming BluetoothContext. Must be called inside a component
 * that is a descendant of `BluetoothProvider`.
 *
 * @throws {Error} If called outside of a BluetoothProvider subtree.
 * @returns The full BluetoothContextType value.
 */
export const useBluetoothContext = () => {
  const context = useContext(BluetoothContext);
  if (!context) {
    throw new Error('useBluetoothContext must be used within BluetoothProvider');
  }
  return context;
};