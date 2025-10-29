import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';

/**
 * TemperatureCircle
 * ------------------
 * Displays the current temperature inside a circular indicator.
 *
 * - Border color changes based on temperature range:
 *   - Red if < 2°C or > 8°C (out of safe range)
 *   - Green if within range (2–8°C)
 * - Centered temperature text in large, readable font
 */

type TemperatureCircleProps = {
  temperature: number;
};

export const TemperatureCircle: React.FC<TemperatureCircleProps> = ({ temperature }) => {
  // Determine border color based on temperature range
  const getBorderColor = () => {
    if (temperature < 2 || temperature > 8) return '#D34949'; // Red for unsafe temperature
    return '#5DB565'; // Green for safe temperature
  };

  return (
    <Box
      justifyContent="center"
      alignItems="center"
      borderWidth={5}
      borderColor={getBorderColor()}
      borderRadius="$full"
      width={250}
      height={250}
    >
      {/* Display temperature value */}
      <Text fontSize="$7xl" fontWeight="$normal" color="white">
        {temperature}°C
      </Text>
    </Box>
  );
};

export default TemperatureCircle;
