/**
 * TemperatureCircle
 * ==================
 * Displays the current fridge temperature inside a circular visual indicator.
 *
 * Features:
 * - Responsive circle sizing based on screen height
 * - Border color signals temperature safety:
 *   - Red if < 2°C or > 8°C (out of safe range - unsafe)
 *   - Green if 2–8°C (within safe range - optimal)
 * - Dynamic glow shadow matches border color for visual feedback
 * - Large, centered temperature text with degree symbol
 */

import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';

/* -------------------------------------------------------------------------- */
/*                             Type Definitions                               */
/* -------------------------------------------------------------------------- */

type TemperatureCircleProps = {
  temperature: number;  // Current temperature in Celsius
};

/* -------------------------------------------------------------------------- */
/*                             Component Definition                            */
/* -------------------------------------------------------------------------- */

export const TemperatureCircle: React.FC<TemperatureCircleProps> = ({
  temperature,
}) => {
  const { height } = Dimensions.get('window');

  /* -------------------------------------------------------------------- */
  /*                          Responsive Sizing                            */
  /* -------------------------------------------------------------------- */

  // All dimensions scale fluidly based on screen height
  const size = height * 0.27;                              // Circle diameter
  const borderWidth = Math.max(2, Math.round(size * 0.03)); // Min 2px border
  const fontSize = Math.max(18, Math.round(size * 0.29));  // Min 18px text

  /* -------------------------------------------------------------------- */
  /*                      Temperature Range Logic                          */
  /* -------------------------------------------------------------------- */

  /**
   * getBorderColor()
   * ----------------
   * Determines border color based on temperature safety.
   * Safe range: 2–8°C (green glow)
   * Danger zones: < 2°C or > 8°C (red glow)
   */
  const getBorderColor = () => {
    if (temperature < 2 || temperature > 8) return '#D34949'; // Red: Unsafe
    return '#5DB565';                                          // Green: Safe
  };

  return (
    <Box
      justifyContent="center"
      alignItems="center"
      bg='#1C1C1C'
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth,
        borderColor: getBorderColor(),
        shadowColor: getBorderColor(),  // Glow matches border for visual coherence
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 15,
      }}
    >
      {/* Temperature text, centered */}
      <Text
        color="white"
        style={{
          fontSize,
          lineHeight: fontSize,
          fontWeight: '400',
        }}
      >
        {temperature}°C
      </Text>
    </Box>
  );
};

export default TemperatureCircle;
