import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';

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

export const TemperatureCircle: React.FC<TemperatureCircleProps> = ({
  temperature,
}) => {
  const { height } = Dimensions.get('window');

  const size = height * 0.27;
  const borderWidth = Math.max(2, Math.round(size * 0.03));
  const fontSize = Math.max(18, Math.round(size * 0.29));

  // Determine border color based on temperature range
  const getBorderColor = () => {
    if (temperature < 2 || temperature > 8) return '#D34949'; // Red for unsafe temperature
    return '#5DB565'; // Green for safe temperature
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
        shadowColor: getBorderColor(), // Glow matches border color
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: .8,
        shadowRadius: 15,
        elevation: 15,
      }}
    >
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
