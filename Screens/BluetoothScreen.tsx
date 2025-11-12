import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { ScreenHeader } from '../components/ScreenHeader';

const BluetoothScreen: React.FC = () => {
  return (
    <Box flex={1} p="$4">
      <ScreenHeader title="Bluetooth"
      infoText="The Bluetooth screen will be implemented in future updates, allowing you to connect the app to a refrigerator device. Ensure that Bluetooth is enabled on your phone, then tap 'Scan' to search for nearby refrigerators. Once your device appears, select it to pair and begin receiving data such as temperature, inventory, and system status."
 />
    </Box>
  );
};

export default BluetoothScreen;
