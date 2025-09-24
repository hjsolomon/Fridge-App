import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { ScreenHeader } from '../components/ScreenHeader';


const InventoryScreen: React.FC = () => {
  return (
    <Box flex={1} bg="#1C1C1C" p="$4">
        <ScreenHeader title="Inventory" />
    </Box>
  );
};

export default InventoryScreen;
