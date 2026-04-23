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

import {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Device } from 'react-native-ble-plx';
import { bleManager } from './bleManager';
import { Buffer } from 'buffer';
import firestore from '@react-native-firebase/firestore';
import { logSensorReadingFirestore } from '@/db/firestoreSensorReading';
import { v4 as uuidv4 } from 'uuid';
import { logInventoryActionFirestore } from '@/db/firestoreInventory';

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
  const [tempCharacteristicData, setTempCharacteristicData] = useState<
    string | null
  >(null);
  const [vaccineCharacteristicData, setVaccineCharacteristicData] = useState<
    string | null
  >(null);

  // Power source states — default false until a characteristic update is received
  const [solar, setSolar] = useState(false);
  const [grid, setGrid] = useState(false);
  const [battery, setBattery] = useState(false);

  // Refs mirror power source state so the temp callback always reads the latest
  // value without a stale closure — state alone would capture the value at
  // subscription time and never update inside the async callback.
  const solarRef = useRef(false);
  const gridRef = useRef(false);
  const batteryRef = useRef(false);

  // Track if BT is currently disabling to block all state updates and async operations
  const disablingRef = useRef(false);
  const subscriptionsRef = useRef<Array<any>>([]);
  const connectionAliveRef = useRef(false);

  // True while the Arduino is replaying buffered (ageMins > 0) readings on connect.
  // The Firestore inventory write-back is suppressed during this window to avoid
  // a BLE write colliding with the flush and dropping the connection.
  const syncingBufferRef = useRef(false);

  // Helper: determine if discovered device is a fridge target
  const isFridgeDevice = (device?: Device | null): boolean => {
    if (!device?.name) return false;
    return device.name.toLowerCase().includes('fridge');
  };

  // Helper: add missing devices without duplicate IDs
  const addUniqueDevice = (
    setter: Dispatch<SetStateAction<Device[]>>,
    device: Device,
  ) => {
    setter(devices => {
      const exists = devices.some(entry => entry.id === device.id);
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
    const subscription = bleManager.onStateChange(state => {
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
            console.warn(
              'Error removing subscription during BT disable:',
              error,
            );
          }
        });
        subscriptionsRef.current = [];

        // Cancel device connection without awaiting to avoid blocking
        if (connectedDevice) {
          bleManager.cancelDeviceConnection(connectedDevice.id).catch(error => {
            console.warn(
              'Error canceling device connection on BT disable:',
              error,
            );
          });
        }

        // Clear all state synchronously
        setConnectedDevice(null);
        setTempCharacteristicData(null);
        setVaccineCharacteristicData(null);
        setSolar(false);   solarRef.current = false;
        setGrid(false);    gridRef.current = false;
        setBattery(false); batteryRef.current = false;
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

      connectionAliveRef.current = false;

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
  const subscribeToCharacteristic = useCallback(
    async (
      serviceUUID: string,
      characteristicUUID: string,
      onUpdate?: (value: string) => void,
      dataType: 'int32' | 'float' | 'utf8' | 'temp8' = 'int32',
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
            if (error) {
              // Ignore expected disconnect errors
              if (
                error.errorCode === 201 || // DeviceDisconnected
                error.errorCode === 2 // OperationCancelled
              ) {
                return;
              }

              console.error('Subscription error:', error);
              return;
            }

            if (
              disablingRef.current ||
              !connectionAliveRef.current ||
              !bluetoothEnabled
            ) {
              return;
            }
            if (!characteristic?.value) return;

            try {
              const decodedValue = Buffer.from(characteristic.value, 'base64');

              // Decode based on specified data type
              let value: string | number;
              if (dataType === 'temp8') {
                if (decodedValue.length === 8) {
                  // New firmware: float32 temperature + uint32 age in minutes
                  const temp = Math.round(decodedValue.readFloatLE(0) * 10) / 10;
                  const ageMins = decodedValue.readUInt32LE(4);
                  value = `${temp}:${ageMins}`;
                } else if (decodedValue.length === 4) {
                  // Legacy firmware: plain float, treat as a live reading (age = 0)
                  const temp = Math.round(decodedValue.readFloatLE(0) * 10) / 10;
                  value = `${temp}:0`;
                } else {
                  value = decodedValue.toString('utf8');
                }
              } else if (dataType === 'float' && decodedValue.length === 4) {
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
              console.error(
                'Failed to decode characteristic value:',
                decodeError,
              );
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
    },
    [connectedDevice],
  );

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
      setSolar(false);   solarRef.current = false;
      setGrid(false);    gridRef.current = false;
      setBattery(false); batteryRef.current = false;
      return;
    }

    let isMounted = true;

    const setupSubscription = async () => {
      try {
        // Service and characteristic UUIDs from device firmware
        const SERVICE_UUID = '6a8da328-7627-43a6-a5b4-a4cfb5fd139c';
        const TEMP_CHARACTERISTIC_UUID = '96ac696e-aba0-467f-8fd9-910a55394e54';
        const VACCINE_CHARACTERISTIC_UUID =
          'bf83677e-0135-4b7e-9f42-df8d32ad39c9';
        const SOLAR_CHARACTERISTIC_UUID =
          '446b6bee-b10b-4a0b-9114-29b86b23f8d8';
        const GRID_CHARACTERISTIC_UUID =
          '499d19ec-35b7-450c-88bc-8a9963008879';
        const BATTERY_SOURCE_CHARACTERISTIC_UUID =
          '5c51b225-e17e-45fd-b4a9-84a635b71cad';

        // Subscribe to temperature updates.
        // The characteristic sends 8 bytes decoded as "temp:ageMins" where
        // ageMins is how many minutes ago the reading was taken (0 = live).
        // The actual timestamp is computed from the age so that readings
        // buffered on the Arduino while disconnected are stored with the
        // correct time rather than the time the app received them.
        const tempSubscription = await subscribeToCharacteristic(
          SERVICE_UUID,
          TEMP_CHARACTERISTIC_UUID,
          async value => {
            if (isMounted && !disablingRef.current) {
              // Parse "temp:ageMins" format
              const colonIdx = value.indexOf(':');
              const tempValue = parseFloat(
                colonIdx >= 0 ? value.slice(0, colonIdx) : value,
              );
              const ageMins =
                colonIdx >= 0 ? parseInt(value.slice(colonIdx + 1), 10) : 0;

              // Track whether the Arduino is still replaying buffered readings.
              // ageMins > 0 means a stored reading; 0 means the flush is done.
              syncingBufferRef.current = ageMins > 0;

              // Expose only the temperature value to UI consumers
              setTempCharacteristicData(String(tempValue));

              if (!isNaN(tempValue)) {
                // Back-calculate when the reading was actually taken
                const timestamp = new Date(
                  Date.now() - ageMins * 60 * 1000,
                ).toISOString();

                const log = {
                  reading_id: uuidv4(),
                  fridge_id: 'fridge_1',
                  temperature: tempValue,
                  battery_level: 50,
                  timestamp,
                  synced: 0,
                  solar: solarRef.current,
                  grid: gridRef.current,
                  battery: batteryRef.current,
                };
                try {
                  await logSensorReadingFirestore(log);
                } catch (error) {
                  console.error(
                    'Failed to log temperature to Firestore:',
                    error,
                  );
                }
              }
            }
          },
          'temp8',
        );

        if (tempSubscription && isMounted && !disablingRef.current) {
          subscriptionsRef.current.push(tempSubscription);
        }

        // Subscribe to vaccine count updates
        const vaccineSubscription = await subscribeToCharacteristic(
          SERVICE_UUID,
          VACCINE_CHARACTERISTIC_UUID,
          async value => {
            if (isMounted && !disablingRef.current) {
              setVaccineCharacteristicData(value);
              // Update inventory count in Firestore
              const vaccineValue = parseInt(value, 10);
              if (!isNaN(vaccineValue)) {
                const log = {
                  log_id: uuidv4(),
                  fridge_id: 'fridge_1',
                  action: 'set' as const,
                  count: vaccineValue,
                  timestamp: new Date().toISOString(),
                  synced: 0,
                };
                try {
                  await logInventoryActionFirestore(log);
                } catch (error) {
                  console.error(
                    'Failed to update inventory from vaccine characteristic:',
                    error,
                  );
                }
              }
            }
          },
          'int32',
        );

        if (vaccineSubscription && isMounted && !disablingRef.current) {
          subscriptionsRef.current.push(vaccineSubscription);
        }

        // Subscribe to power source characteristics.
        // Each is an int32 where non-zero = active. If the characteristic is
        // absent or fails to subscribe the setter is never called, leaving the
        // default value of false.
        const solarSubscription = await subscribeToCharacteristic(
          SERVICE_UUID,
          SOLAR_CHARACTERISTIC_UUID,
          value => {
            if (isMounted && !disablingRef.current) {
              const active = parseInt(value, 10) !== 0;
              solarRef.current = active;
              setSolar(active);
            }
          },
          'int32',
        );
        if (solarSubscription && isMounted && !disablingRef.current) {
          subscriptionsRef.current.push(solarSubscription);
        }

        const gridSubscription = await subscribeToCharacteristic(
          SERVICE_UUID,
          GRID_CHARACTERISTIC_UUID,
          value => {
            if (isMounted && !disablingRef.current) {
              const active = parseInt(value, 10) !== 0;
              gridRef.current = active;
              setGrid(active);
            }
          },
          'int32',
        );
        if (gridSubscription && isMounted && !disablingRef.current) {
          subscriptionsRef.current.push(gridSubscription);
        }

        const batterySourceSubscription = await subscribeToCharacteristic(
          SERVICE_UUID,
          BATTERY_SOURCE_CHARACTERISTIC_UUID,
          value => {
            if (isMounted && !disablingRef.current) {
              const active = parseInt(value, 10) !== 0;
              batteryRef.current = active;
              setBattery(active);
            }
          },
          'int32',
        );
        if (batterySourceSubscription && isMounted && !disablingRef.current) {
          subscriptionsRef.current.push(batterySourceSubscription);
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

  const writeCharacteristic = useCallback(
    async (
      serviceUUID: string,
      characteristicUUID: string,
      value: string | number,
      dataType: 'int32' | 'float' | 'utf8' = 'int32',
    ) => {
      if (
        !connectedDevice ||
        !connectionAliveRef.current ||
        disablingRef.current ||
        !bluetoothEnabled
      ) {
        return;
      }

      try {
        let buffer;

        if (dataType === 'int32') {
          buffer = Buffer.alloc(4);
          buffer.writeInt32LE(Number(value), 0);
        } else if (dataType === 'float') {
          buffer = Buffer.alloc(4);
          buffer.writeFloatLE(Number(value), 0);
        } else {
          buffer = Buffer.from(String(value), 'utf8');
        }

        const base64Value = buffer.toString('base64');

        await connectedDevice.writeCharacteristicWithResponseForService(
          serviceUUID,
          characteristicUUID,
          base64Value,
        );

        console.log('Write success:', value);
      } catch (error) {
        if (connectionAliveRef.current) {
          console.error('Write failed:', error);
        }
      }
    },
    [connectedDevice, bluetoothEnabled],
  );

  useEffect(() => {
    if (!connectedDevice) return;

    const SERVICE_UUID = '6a8da328-7627-43a6-a5b4-a4cfb5fd139c';

    const INVENTORY_WRITE_UUID = 'bf83677e-0135-4b7e-9f42-df8d32ad39c9';

    const unsubscribe = firestore()
      .collection('Inventory')
      .doc('fridge_1')
      .onSnapshot(async snapshot => {
        if (
          !snapshot.exists() ||
          !connectionAliveRef.current ||
          disablingRef.current ||
          !bluetoothEnabled ||
          syncingBufferRef.current
        ) {
          return;
        }

        const count = snapshot.data()?.current_count ?? 0;

        console.log('Inventory changed:', count);

        await writeCharacteristic(
          SERVICE_UUID,
          INVENTORY_WRITE_UUID,
          count,
          'int32',
        );
      });

    return unsubscribe;
  }, [connectedDevice, writeCharacteristic, bluetoothEnabled]);

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
    const MAX_RETRIES = 3;
    const CONNECT_TIMEOUT_MS = 30000;
    let lastError: unknown;

    // Android BLE stack conflicts when scanning and connecting simultaneously.
    // Stop any active scan before attempting connection.
    bleManager.stopDeviceScan();
    setScanning(false);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const connected = await device.connect({ timeout: CONNECT_TIMEOUT_MS });
        await connected.discoverAllServicesAndCharacteristics();

        connectionAliveRef.current = true;
        setConnectedDevice(connected);

        addUniqueDevice(setDevices, connected);
        if (isFridgeDevice(connected)) {
          addUniqueDevice(setFridgeDevices, connected);
        }

        return connected;
      } catch (e) {
        lastError = e;
        console.warn(`Connection attempt ${attempt}/${MAX_RETRIES} failed:`, e);
        if (attempt < MAX_RETRIES) {
          await bleManager.cancelDeviceConnection(device.id).catch(() => {});
        }
      }
    }

    throw lastError;
  };

  /* -------------------------------------------------------------------- */
  /*                           Device Disconnection                            */
  /* -------------------------------------------------------------------- */

  /**
   * disconnect()
   * -------------
   * Disconnects from the currently connected device, if any.
   * Updates state to reflect disconnection and cleans up resources.
   * Does not throw errors to avoid disrupting user flow, but logs any issues encountered.
   * Requires: A connected device to be present
   * Note: The onDisconnected listener will also update state when disconnection is detected, so this function primarily initiates the disconnect process.
   *       Any errors during disconnection are logged but not thrown to avoid disrupting user flow, as disconnection can occur for various reasons (e.g., device out of range) that may not require user intervention.
   *
   * Steps:
   * 1. Check if a device is currently connected; if not, exit early
   * 2. Attempt to cancel the device connection using the BLE manager
   * 3. If successful, update state to reflect no connected device
   * 4. If an error occurs, log the error for debugging purposes but do not throw it to avoid disrupting user flow
   */

  const disconnect = async () => {
    if (!connectedDevice) return;

    connectionAliveRef.current = false;

    try {
      await bleManager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
    } catch (error) {
      console.warn('Disconnect failed:', error);
    }
  };

  /* -------------------------------------------------------------------- */
  /*                            Hook API Return Value                       */
  /* -------------------------------------------------------------------- */

  return {
    // State
    devices, // All discovered devices
    fridgeDevices, // Devices with 'fridge' in name
    scanning, // Whether scan is in progress
    connectedDevice, // Currently connected device (or null)
    bluetoothEnabled, // Whether Bluetooth is enabled
    tempCharacteristicData, // Latest temperature from BLE
    vaccineCharacteristicData, // Latest vaccine count from BLE
    solar, // Whether solar power source is active
    grid, // Whether grid power source is active
    battery, // Whether battery power source is active

    // Methods
    scan, // Start 10-second device scan
    connect, // Connect to device and discover services
    subscribeToCharacteristic, // Subscribe to and decode characteristic updates
    writeCharacteristic, // Write value to characteristic with specified data type
    disconnect, // Disconnect from current device
  };
}
