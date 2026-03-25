/**
 * useBluetooth
 * ============
 * Custom hook for managing Bluetooth Low Energy (BLE) device scanning,
 * connection, and characteristic subscription.
 *
 * Features:
 * - Device scanning with filtering for fridge devices
 * - Persistent connection management
 * - Automatic disconnection detection
 * - Characteristic subscription with decoding (int32 / UTF-8)
 * - Cleanup on unmount
 */

import { Dispatch, SetStateAction, useEffect, useState, useCallback, useRef } from 'react';
import { Device } from 'react-native-ble-plx';
import { bleManager } from './bleManager';
import { Buffer } from 'buffer';
import firestore from '@react-native-firebase/firestore';
import { logSensorReadingFirestore } from '@/db/firestoreSensorReading';
import { v4 as uuidv4 } from 'uuid';

/* -------------------------------------------------------------------------- */
/*                                  State Management                            */
/* -------------------------------------------------------------------------- */

export function useBluetooth() {
  // All discovered devices during scan
  const [devices, setDevices] = useState<Device[]>([]);

  // Filtered devices containing 'fridge' in their name
  const [fridgeDevices, setFridgeDevices] = useState<Device[]>([]);

  // Whether a scan is currently in progress
  const [scanning, setScanning] = useState(false);

  // Currently connected device (null if disconnected)
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  // Bluetooth adapter state
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean>(false);

  // Characteristic data
  const [tempCharacteristicData, setTempCharacteristicData] = useState<string | null>(null);
  const [vaccineCharacteristicData, setVaccineCharacteristicData] = useState<string | null>(null);

  // Track if BT is currently disabling to block all state updates and async operations
  const disablingRef = useRef(false);
  const subscriptionsRef = useRef<Array<any>>([]);

  // Helper: determine if discovered device is a fridge target
  const isFridgeDevice = (device?: Device | null): boolean => {
    if (!device?.name) return false;
    return device.name.toLowerCase().includes('fridge');
  };

  // Helper: add missing devices without duplicate IDs
  const addUniqueDevice = (setter: Dispatch<SetStateAction<Device[]>>, device: Device) => {
    setter((devices) => {
      const exists = devices.some((entry) => entry.id === device.id);
      if (exists) return devices;
      return [...devices, device];
    });
  };

  /* -------------------------------------------------------------------- */
  /*                        Connection Lifecycle Management                 */
  /* -------------------------------------------------------------------- */

  /**
   * Monitors Bluetooth adapter state changes.
   * Automatically disconnects device and stops scan if Bluetooth is disabled.
   */
  useEffect(() => {
    const subscription = bleManager.onStateChange((state) => {
      const enabled = state === 'PoweredOn';
      
      if (!enabled && !disablingRef.current) {
        // Mark as disabling to block all state updates and async callbacks
        disablingRef.current = true;

        // Stop scan immediately
        if (scanning) {
          bleManager.stopDeviceScan();
          setScanning(false);
        }

        // Clean up all active subscriptions
        subscriptionsRef.current.forEach(sub => {
          try {
            sub?.remove?.();
          } catch (error) {
            console.warn('Error removing subscription during BT disable:', error);
          }
        });
        subscriptionsRef.current = [];

        // Cancel device connection without awaiting to avoid blocking
        if (connectedDevice) {
          bleManager.cancelDeviceConnection(connectedDevice.id).catch((error) => {
            console.warn('Error canceling device connection on BT disable:', error);
          });
        }

        // Clear all state synchronously
        setConnectedDevice(null);
        setTempCharacteristicData(null);
        setVaccineCharacteristicData(null);
        setBluetoothEnabled(false);
      } else if (enabled) {
        // Reset disabling flag when BT comes back on
        disablingRef.current = false;
        setBluetoothEnabled(true);
      }
    }, true);

    return () => subscription.remove();
  }, [scanning, connectedDevice]);

  /**
   * Listens for device disconnection events and updates state.
   * Automatically cleans up subscription on unmount or device change.
   */
  useEffect(() => {
    if (!connectedDevice) return;

    const subscription = connectedDevice.onDisconnected(() => {
      console.warn('Device disconnection event received');
      setConnectedDevice(null);
    });

    return () => subscription.remove();
  }, [connectedDevice]);

  /* -------------------------------------------------------------------- */
  /*                    Characteristic Subscription & Decoding              */
  /* -------------------------------------------------------------------- */

  /**
   * subscribeToCharacteristic()
   * ----------------------------
   * Subscribes to a BLE characteristic and decodes incoming values.
   *
   * Parameters:
   * - serviceUUID: UUID of the service containing the characteristic
   * - characteristicUUID: UUID of the characteristic to monitor
   * - onUpdate: Callback invoked with decoded value (as string)
   * - dataType: Optional data type for decoding ('int32', 'float', or 'utf8')
   *
   * Decoding Logic:
   * - 'float': 4-byte IEEE 754 little-endian floating-point number
   * - 'int32' (default): 4-byte signed 32-bit little-endian integer
   * - 'utf8': Decoded as UTF-8 string
   *
   * Returns: Subscription object for cleanup, or null if subscription fails
   * Requires: A connected device to be present
   */
  const subscribeToCharacteristic = useCallback(async (
    serviceUUID: string,
    characteristicUUID: string,
    onUpdate?: (value: string) => void,
    dataType: 'int32' | 'float' | 'utf8' = 'int32',
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
          // Block all operations if BT is disabling
          if (disablingRef.current || !connectedDevice || !bluetoothEnabled) {
            return;
          }
          if (error) {
            console.error('Subscription error:', error);
            return;
          }
          if (!characteristic?.value) return;

          try {
            const decodedValue = Buffer.from(characteristic.value, 'base64');

            // Decode based on specified data type
            let value: string | number;
            if (dataType === 'float' && decodedValue.length === 4) {
              // 4 bytes → IEEE 754 float, rounded to 1 decimal place
              value = Math.round(decodedValue.readFloatLE(0) * 10) / 10;
            } else if (dataType === 'int32' && decodedValue.length === 4) {
              // 4 bytes → signed 32-bit integer
              value = decodedValue.readInt32LE(0);
            } else {
              // Otherwise → UTF-8 string
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

  /**
   * Sets up subscriptions to temperature and vaccine characteristics when connected.
   * Logs received data to Firestore.
   */
  useEffect(() => {
    if (!connectedDevice) {
      // Clean up when disconnecting
      subscriptionsRef.current.forEach(sub => {
        try {
          sub?.remove?.();
        } catch (error) {
          console.warn('Error removing subscription on disconnect:', error);
        }
      });
      subscriptionsRef.current = [];

      setTempCharacteristicData(null);
      setVaccineCharacteristicData(null);
      return;
    }

    let isMounted = true;

    const setupSubscription = async () => {
      try {
        // Service and characteristic UUIDs from device firmware
        const SERVICE_UUID = '6a8da328-7627-43a6-a5b4-a4cfb5fd139c';
        const TEMP_CHARACTERISTIC_UUID = '96ac696e-aba0-467f-8fd9-910a55394e54';
        const VACCINE_CHARACTERISTIC_UUID = 'bf83677e-0135-4b7e-9f42-df8d32ad39c9';

        // Subscribe to temperature updates
        const tempSubscription = await subscribeToCharacteristic(
          SERVICE_UUID,
          TEMP_CHARACTERISTIC_UUID,
          async (value) => {
            if (isMounted && !disablingRef.current) {
              setTempCharacteristicData(value);
              // Log to Firestore
              const tempValue = parseFloat(value);
              if (!isNaN(tempValue)) {
                const log = {
                  reading_id: uuidv4(),
                  fridge_id: 'fridge_1',
                  temperature: tempValue,
                  battery_level: 50,
                  timestamp: new Date().toISOString(),
                  synced: 0,
                };
                try {
                  await logSensorReadingFirestore(log);
                } catch (error) {
                  console.error('Failed to log temperature to Firestore:', error);
                }
              }
            }
          },
          'float',
        );

        if (tempSubscription && isMounted && !disablingRef.current) {
          subscriptionsRef.current.push(tempSubscription);
        }

        // Subscribe to vaccine count updates
        const vaccineSubscription = await subscribeToCharacteristic(
          SERVICE_UUID,
          VACCINE_CHARACTERISTIC_UUID,
          async (value) => {
            if (isMounted && !disablingRef.current) {
              setVaccineCharacteristicData(value);
              // Update inventory count in Firestore
              const vaccineValue = parseInt(value, 10);
              if (!isNaN(vaccineValue)) {
                const invRef = firestore().collection('Inventory').doc('fridge_1');
                try {
                  await invRef.set({ current_count: vaccineValue }, { merge: true });
                } catch (error) {
                  console.error('Failed to update inventory count:', error);
                }
              }
            }
          },
        );

        if (vaccineSubscription && isMounted && !disablingRef.current) {
          subscriptionsRef.current.push(vaccineSubscription);
        }
      } catch (error) {
        console.error('Failed to setup subscriptions:', error);
      }
    };

    setupSubscription();

    // Cleanup: Remove subscriptions and mark unmounted
    return () => {
      isMounted = false;
      subscriptionsRef.current.forEach(sub => {
        try {
          sub?.remove?.();
        } catch (error) {
          console.error('Error removing subscription:', error);
        }
      });
      subscriptionsRef.current = [];
    };
  }, [connectedDevice, subscribeToCharacteristic]);

  /**
   * Cleanup on unmount: stops any active device scan.
   * Prevents memory leaks and unnecessary BLE radio activity.
   */
  useEffect(() => {
    return () => {
      bleManager.stopDeviceScan();
    };
  }, []);

  /* -------------------------------------------------------------------- */
  /*                           Device Scanning                              */
  /* -------------------------------------------------------------------- */

  /**
   * scan()
   * ------
   * Initiates a 10-second BLE device scan.
   *
   * Behavior:
   * - Checks if Bluetooth is enabled
   * - Clears previous device lists
   * - Starts scanning and deduplicates by device ID
   * - Filters devices with 'fridge' in name into separate list
   * - Auto-stops scan after 10 seconds
   * - Updates scanning state accordingly
   */
  const scan = () => {
    if (!bluetoothEnabled) {
      console.warn('Bluetooth is not enabled');
      return;
    }

    // Preserve any connected device so it does not disappear from the list mid-scan
    if (connectedDevice) {
      addUniqueDevice(setDevices, connectedDevice);
      if (isFridgeDevice(connectedDevice)) {
        addUniqueDevice(setFridgeDevices, connectedDevice);
      }
    }
    setScanning(true);

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.warn('Scan error:', error);
        setScanning(false);
        return;
      }

      if (!device?.name) {
        return;
      }

      addUniqueDevice(setDevices, device);
      if (isFridgeDevice(device)) {
        addUniqueDevice(setFridgeDevices, device);
      }
    });

    // Stop scan after 10 seconds
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setScanning(false);
    }, 10000);
  };

  /* -------------------------------------------------------------------- */
  /*                      Device Connection & Discovery                    */
  /* -------------------------------------------------------------------- */

  /**
   * connect(device)
   * ----------------
   * Connects to a BLE device and discovers all services/characteristics.
   *
   * Steps:
   * 1. Establish connection to device
   * 2. Discover all available services and characteristics
   * 3. Update state to mark device as connected
   * 4. Return connected device for use
   *
   * Throws: Error if connection or discovery fails
   */
  const connect = async (device: Device) => {
    try {
      const connected = await device.connect();
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);

      // Ensure connected device remains present in the scan results lists.
      addUniqueDevice(setDevices, connected);
      if (isFridgeDevice(connected)) {
        addUniqueDevice(setFridgeDevices, connected);
      }

      return connected;
    } catch (e) {
      console.warn('Connection failed:', e);
      throw e;
    }
  };

  /* -------------------------------------------------------------------- */
  /*                            Hook API Return Value                       */
  /* -------------------------------------------------------------------- */

  return {
    // State
    devices,                        // All discovered devices
    fridgeDevices,                  // Devices with 'fridge' in name
    scanning,                       // Whether scan is in progress
    connectedDevice,                // Currently connected device (or null)
    bluetoothEnabled,               // Whether Bluetooth is enabled
    tempCharacteristicData,         // Latest temperature from BLE
    vaccineCharacteristicData,      // Latest vaccine count from BLE

    // Methods
    scan,                           // Start 10-second device scan
    connect,                        // Connect to device and discover services
    subscribeToCharacteristic,      // Subscribe to and decode characteristic updates
  };
}
