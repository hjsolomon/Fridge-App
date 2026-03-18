/**
 * BluetoothScreen
 * ================
 * Manages BLE device scanning, connection, and characteristic subscription.
 *
 * Features:
 * - Scans for nearby BLE devices (all and fridge-specific)
 * - Displays scanned devices in expandable list
 * - Connects to selected device and discovers services
 * - Subscribes to temperature and vaccine count characteristics
 * - Android permission handling
 * - Real-time characteristic data display
 */

import React, { useEffect } from 'react';
import { FlatList, Platform } from 'react-native';
import { Box, Button, ButtonText, Text, Spinner } from '@gluestack-ui/themed';
import { ScreenHeader } from '../components/ScreenHeader';
import { useBluetooth } from '../components/bluetooth/useBluetooth';
import { useAndroidPermissions } from './../utils/useAndroidPermissions';
import { Dimensions } from 'react-native';

/* -------------------------------------------------------------------------- */
/*                         Component Definition                                */
/* -------------------------------------------------------------------------- */

const BluetoothScreen: React.FC = () => {
  /* -------------------------------------------------------------------- */
  /*                     BLE Hook and State Management                     */
  /* -------------------------------------------------------------------- */

  // BLE operations: scanning, connecting, subscribing
  const { devices, scanning, fridgeDevices, scan, connect, connectedDevice, subscribeToCharacteristic } = useBluetooth();

  const { width } = Dimensions.get('window');
  const buttonWidth = width * 0.9;

  // Characteristic data from connected device
  const [tempCharacteristicData, setTempCharacteristicData] = React.useState<string | null>(null);
  const [vaccineCharacteristicData, setVaccineCharacteristicData] =
    React.useState<string | null>(null);

  /* -------------------------------------------------------------------- */
  /*                    Permissions (Android Only)                        */
  /* -------------------------------------------------------------------- */

  const {
    waiting,
    granted,
    shouldOpenSettings,
    requestPermissions,
    openSettings,
  } =
    Platform.OS === 'android'
      ? useAndroidPermissions()
      : {
          waiting: false,
          granted: true,
          shouldOpenSettings: false,
          requestPermissions: async () => {},
          openSettings: () => {},
        };

  /* -------------------------------------------------------------------- */
  /*                  Characteristic Subscription Setup                    */
  /* -------------------------------------------------------------------- */

  /**
   * Effect: Subscribe to temperature and vaccine characteristics.
   * Cleanup: Remove all subscriptions on unmount or device change.
   *
   * Flow:
   * 1. Check if device is connected
   * 2. Define service and characteristic UUIDs
   * 3. Subscribe to both characteristics
   * 4. Update state with incoming data
   * 5. Clean up subscriptions on unmount
   */
  useEffect(() => {
    if (!connectedDevice) {
      setTempCharacteristicData(null);
      setVaccineCharacteristicData(null);
      return;
    }

    let isMounted = true;
    let subscriptions: Array<any> = [];

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
          (value) => {
            if (isMounted) setTempCharacteristicData(value);
          },
        );

        if (tempSubscription && isMounted) {
          subscriptions.push(tempSubscription);
        }

        // Subscribe to vaccine count updates
        const vaccineSubscription = await subscribeToCharacteristic(
          SERVICE_UUID,
          VACCINE_CHARACTERISTIC_UUID,
          (value) => {
            if (isMounted) setVaccineCharacteristicData(value);
          },
        );

        if (vaccineSubscription && isMounted) {
          subscriptions.push(vaccineSubscription);
        }
      } catch (error) {
        console.error('Failed to setup subscriptions:', error);
      }
    };

    setupSubscription();

    // Cleanup: Remove subscriptions and mark unmounted
    return () => {
      isMounted = false;
      subscriptions.forEach(sub => {
        try {
          sub?.remove?.();
        } catch (error) {
          console.error('Error removing subscription:', error);
        }
      });
      subscriptions = [];
    };
  }, [connectedDevice, subscribeToCharacteristic]);

  /* -------------------------------------------------------------------- */
  /*                         Permission States                             */
  /* -------------------------------------------------------------------- */

  // Show spinner while waiting for permission response
  if (waiting) {
    return (
      <Box flex={1} alignItems="center" justifyContent="center">
        <Spinner />
        <Text mt="$2">Requesting Bluetooth permissions…</Text>
      </Box>
    );
  }

  // Show permission request if not granted
  if (!granted) {
    return (
      <Box flex={1} p="$4">
        <ScreenHeader
          title="Bluetooth"
          infoText="Enable Bluetooth and scan for nearby refrigerators."
        />
        <Box flex={1} justifyContent="center">
          <Text color="white" textAlign="center">
            {shouldOpenSettings
              ? 'Bluetooth permissions are required. Please enable them in Settings.'
              : 'Bluetooth permissions are required to connect to your refrigerator.'}
          </Text>
          <Button
            bg="#3a783e"
            rounded="$3xl"
            alignSelf="center"
            justifyContent="center"
            alignItems="center"
            mt="$4"
            px="$6"
            py="$3"
            style={{ width: buttonWidth, minHeight: width * 0.12 }}
            onPress={shouldOpenSettings ? openSettings : requestPermissions}
          >
            <ButtonText size="xl" color="white">
              {shouldOpenSettings ? 'Open Settings' : 'Grant Permissions'}
            </ButtonText>
          </Button>
        </Box>
      </Box>
    );
  }

  /* -------------------------------------------------------------------- */
  /*                          Main UI (Permissions Granted)                */
  /* -------------------------------------------------------------------- */
  return (
    <Box flex={1} p="$4">
      <ScreenHeader
        title="Bluetooth"
        infoText="Enable Bluetooth and scan for nearby refrigerators."
      />

      {/* Scan Button */}
      <Button
        bg="#3a783e"
        rounded="$3xl"
        alignSelf="center"
        justifyContent="center"
        alignItems="center"
        mb="$4"
        px="$6"
        py="$3"
        style={{ width: buttonWidth, minHeight: width * 0.15 }}
        onPress={scan}
        isDisabled={scanning}
      >
        <ButtonText size="xl" color="white">
          {scanning ? 'Scanning…' : 'Scan for Devices'}
        </ButtonText>
      </Button>

      {/* Device List: Shows fridge devices with connection status */}
      <Box
        justifyContent="flex-start"
        bg="#282828ff"
        rounded="$2xl"
        py="$1"
        mb="$6"
      >
        <FlatList
          data={fridgeDevices}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isConnected = connectedDevice?.id === item.id;

            return (
              <Button
                mt="$3"
                bg={isConnected ? '#3a783e' : '#282828ff'}
                onPress={async () => {
                  await connect(item);
                }}
              >
                <Text color="white" fontSize="$lg">
                  {item.name || 'Unnamed Device'}
                </Text>
              </Button>
            );
          }}
        />
      </Box>

      {/* Connection Status */}
      <Text color="white" textAlign="center">
        {connectedDevice
          ? `Connected to ${connectedDevice.name || 'Unnamed Device'}`
          : 'No device connected'}
      </Text>

      {/* Real-time Characteristic Data */}
      <Text color="white" textAlign="center" mt="$2">
        {tempCharacteristicData
          ? `Temperature: ${tempCharacteristicData}°C`
          : 'Waiting for temperature data...'}
      </Text>
      <Text color="white" textAlign="center" mt="$2">
        {vaccineCharacteristicData
          ? `Vaccine Count: ${vaccineCharacteristicData}`
          : 'Waiting for vaccine count data...'}
      </Text>
    </Box>
  );
};


export default BluetoothScreen;
