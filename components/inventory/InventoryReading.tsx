/**
 * InventoryReading.tsx
 * ---------------------
 * Displays the current vaccine vial count as a styled card on the Inventory screen.
 *
 * Sizing is responsive — font size and spacing are calculated as a percentage of
 * the device's screen height so the card looks consistent across device sizes.
 */

import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';

/**
 * InventoryReadingProps
 * ----------------------
 * @prop inventory - The current number of vaccine vials in the fridge.
 */
type InventoryReadingProps = {
  inventory: number;
};

/**
 * InventoryReading
 * -----------------
 * Card component that shows the current inventory count with a label.
 * Renders as a dark rounded box with subtle shadow styling.
 *
 * @param inventory - Current vial count to display.
 */
export const InventoryReading: React.FC<InventoryReadingProps> = ({
  inventory,
}) => {
  const { height } = Dimensions.get('window');

  const metricFontLarge = Math.max(28, Math.round(height * 0.05));

  const spacingS = Math.round(height * 0.01);
  const spacingM = Math.round(height * 0.02);

  return (
    <Box
      alignItems="center"
      justifyContent="center"
      bg="#282828ff"
      rounded="$2xl"
      borderWidth={1}
      borderColor="rgba(255,255,255,0.07)"
      style={{
        paddingTop: spacingS,
        paddingBottom: spacingS,
        marginTop: spacingS,
        marginBottom: spacingM,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 20,
      }}
    >
      {/* Label */}
      <Text color="white" fontSize="$xl">
        Current Inventory
      </Text>

      {/* Value */}
      <Text
        color="white"
        style={{
          fontSize: metricFontLarge,
          fontWeight: '700',
        }}
      >
        {inventory}
      </Text>
    </Box>
  );
};

export default InventoryReading;
