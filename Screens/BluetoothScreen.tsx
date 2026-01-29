import React from 'react';
import { FlatList, Platform } from 'react-native';
import { Box, Button, Text, Spinner } from '@gluestack-ui/themed';
import { ScreenHeader } from '../components/ScreenHeader';
import { useBluetooth } from '../components/bluetooth/useBluetooth';
import { useAndroidPermissions } from './../utils/useAndroidPermissions';

const BluetoothScreen: React.FC = () => {
  const { devices, scanning, scan, connect } = useBluetooth();

  const { waiting, granted, shouldOpenSettings, requestPermissions, openSettings } =
    Platform.OS === 'android'
      ? useAndroidPermissions()
      : { waiting: false, granted: true, shouldOpenSettings: false, requestPermissions: async () => {}, openSettings: () => {} };

  if (waiting) {
    return (
      <Box flex={1} alignItems="center" justifyContent="center">
        <Spinner />
        <Text mt="$2">Requesting Bluetooth permissions…</Text>
      </Box>
    );
  }

  if (!granted) {
    return (
      <Box flex={1} p="$4" justifyContent="center">
        <Text textAlign="center">
          {shouldOpenSettings
            ? 'Bluetooth permissions are required. Please enable them in Settings.'
            : 'Bluetooth permissions are required to connect to your refrigerator.'}
        </Text>
        <Button mt="$4" onPress={shouldOpenSettings ? openSettings : requestPermissions}>
          <Text>{shouldOpenSettings ? 'Open Settings' : 'Grant Permissions'}</Text>
        </Button>
      </Box>
    );
  }

  return (
    <Box flex={1} p="$4">
      <ScreenHeader
        title="Bluetooth"
        infoText="Enable Bluetooth and scan for nearby refrigerators."
      />

      <Button mt="$4" onPress={scan} isDisabled={scanning}>
        <Text>{scanning ? 'Scanning…' : 'Scan for Devices'}</Text>
      </Button>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Button
            mt="$3"
            onPress={async () => {
                await connect(item);
            }}
          >
            <Text>{item.name || 'Unnamed Device'}</Text>
          </Button>
        )}
      />
    </Box>
  );
};

export default BluetoothScreen;