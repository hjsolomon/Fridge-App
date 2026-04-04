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
import { Bluetooth } from 'lucide-react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { useBluetoothContext } from '../components/bluetooth/BluetoothContext';
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
  const {
    devices,
    scanning,
    fridgeDevices,
    scan,
    connect,
    disconnect,
    connectedDevice,
    bluetoothEnabled,
    tempCharacteristicData,
    vaccineCharacteristicData,
  } = useBluetoothContext();

  const { width } = Dimensions.get('window');
  const buttonWidth = width * 0.9;

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

      {!bluetoothEnabled ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text color="white" textAlign="center" fontSize="$lg">
            Bluetooth is disabled. Please enable Bluetooth to connect to
            devices.
          </Text>
        </Box>
      ) : (
        <>
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
            bg="#282828ff"
            rounded="$2xl"
            mb="$6"
            borderWidth={1}
            borderColor="rgba(255,255,255,0.07)"
          >
              <FlatList
                data={fridgeDevices}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ListEmptyComponent={
                  <Box alignItems="center" py="$8">
                    <Bluetooth size={32} color="rgba(255,255,255,0.25)" />
                    <Text color="#FFFFFFCC" mt="$3" fontSize="$sm">No fridge devices found</Text>
                    <Text color="rgba(255,255,255,0.4)" mt="$1" fontSize="$xs">Tap "Scan for Devices" to search</Text>
                  </Box>
                }
                renderItem={({ item }) => {
                  const isConnected = connectedDevice?.id === item.id;
                  return (
                    <Button
                      mt="$3"
                      bg={isConnected ? '#3a783e' : 'transparent'}
                      onPress={async () => { await connect(item); }}
                    >
                      <Text color="white" fontSize="$lg">
                        {item.name || 'Unnamed Device'}
                      </Text>
                    </Button>
                  );
                }}
              />
          </Box>
          {/* Disconnect Button */}
          {connectedDevice && (
            <Button
              bg="#D34949"
              rounded="$3xl"
              alignSelf="center"
              justifyContent="center"
              alignItems="center"
              mt="$4"
              px="$6"
              py="$3"
              style={{ width: buttonWidth, minHeight: width * 0.15 }}
              onPress={disconnect}
            >
              <ButtonText size="xl" color="white">
                Disconnect
              </ButtonText>
            </Button>
          )}
        </>
      )}
    </Box>
  );
};

export default BluetoothScreen;
