import React from 'react';
import { Box, Text } from "@gluestack-ui/themed";

const BluetoothScreen: React.FC = () => {
  return (
    <Box flex={1} bg="#1C1C1C" p="$4">
      <Box width="100%" alignItems="flex-start" my="$8">
        <Text fontWeight="bold" color="white" fontSize="$3xl" textAlign="left">
          Bluetooth
        </Text>
        <Box mt="$2" height={1} width="100%" bg="#FFFFFF" opacity={0.3} />
      </Box>
    </Box>
  );
};

export default BluetoothScreen;
