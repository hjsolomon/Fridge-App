import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';

type InventoryReadingProps = {
  inventory: number;
};

export const InventoryReading = ({ inventory }: InventoryReadingProps) => {

  return (
    <Box
            alignItems="center"
            justifyContent="center"
            bg="#282828ff"
            pt="$3"
            mb="$3"
            mt="$0"
            rounded="$2xl"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 20,
            }}
          >
            <Text color="white" fontSize="$2xl" fontWeight="$normal">
              Current Inventory
            </Text>
            <Text color="white" fontSize="$6xl" fontWeight="$bold" pb="$1">
              {inventory}
            </Text>
          </Box>
  );
};

export default InventoryReading;

