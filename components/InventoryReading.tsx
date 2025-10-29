import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';

/**
 * InventoryReading
 * -----------------
 * Displays the current inventory count in a styled box.
 *
 * - Shows a title ("Current Inventory")
 * - Renders the current inventory value in large, bold text
 * - Styled with shadows and rounded corners to match app theme
 */

type InventoryReadingProps = {
  inventory: number;
};

export const InventoryReading: React.FC<InventoryReadingProps> = ({ inventory }) => {
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
      {/* Section title */}
      <Text color="white" fontSize="$2xl" fontWeight="$normal">
        Current Inventory
      </Text>

      {/* Display inventory value */}
      <Text color="white" fontSize="$6xl" fontWeight="$bold">
        {inventory}
      </Text>
    </Box>
  );
};

export default InventoryReading;
