import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { ScreenHeader } from '../components/ScreenHeader';

const InventoryScreen: React.FC = () => {
  const currentInventory = 30;

  return (
    <Box flex={1} bg="#1C1C1C" p="$4">
      <ScreenHeader title="Inventory" />

      <Box
        alignItems="center"
        justifyContent="center"
        bg="#282828ff"
        pt="$3"
        my="$3"
        rounded="$2xl"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 20,
        }}
      >
        <Text color="white" fontSize="$2xl" fontWeight="$normal" pb="$2">
          Current Inventory
        </Text>
        <Text color="white" fontSize="$8xl" fontWeight="$bold" pb="$2">
          {currentInventory}
        </Text>
      </Box>
    </Box>
  );
};

export default InventoryScreen;
