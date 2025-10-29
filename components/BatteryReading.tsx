import React from 'react';
import { Box, Text, HStack } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';

/**
 * BatteryBar
 * -----------
 * Displays a stylized battery level indicator that scales
 * dynamically with the screen size.
 *
 * - Green when > 50%
 * - Yellow between 20–50%
 * - Red when < 20%
 */

const BatteryBar: React.FC<{ level: number }> = ({ level }) => {
  // Get current screen width to make layout responsive
  const { width } = Dimensions.get('window');

  // Scale battery width and height relative to screen size
  const barWidth = width * 0.85;  // 70% of screen width
  const barHeight = width * 0.2; // 8% of screen width for proportional height
  const tipWidth = barWidth * 0.04; // small tip width (4% of bar width)
  const tipHeight = barHeight * 0.6; // tip slightly shorter than bar

  // Dynamically determine battery fill color
  const getColor = () => {
    if (level > 50) return '#6ebb6aff'; // Green (good)
    if (level > 20) return '#E2C044';   // Yellow (medium)
    return '#FF4D4D';                   // Red (low)
  };

  // Enforce a minimum width equivalent to 40% fill
  // This keeps the text visible even at very low battery levels.
  const minFillPercent = 40;
  const adjustedLevel = Math.max(level, minFillPercent);

  return (
    <Box alignItems="center" justifyContent="center" bg="#1C1C1C" mt="$3">
      <HStack alignItems="center">
        {/* Battery body */}
        <HStack
          w={barWidth}
          h={barHeight}
          borderWidth={2}
          borderColor="#9a9a9aff"
          rounded="$3xl"
          overflow="hidden"
          alignItems="center"
          bg="#1C1C1C"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          {/* Battery fill (with min width of 40%) */}
          <Box
            mx="$2"
            rounded="$2xl"
            h={barHeight * 0.8}
            w={`${adjustedLevel - 4}%`} // visually consistent fill
            px="$3"
            bg={getColor()}
            alignItems="center"
            justifyContent="center"
          >
            <Text
              color="$white"
              fontSize={barHeight * 0.6}
              fontWeight="$light"
            >
              {level}%
            </Text>
          </Box>
        </HStack>

        {/* Battery tip */}
        <Box
          w={tipWidth}
          h={tipHeight}
          bg="#1C1C1C"
          borderColor="#9a9a9aff"
          borderWidth={2}
          borderLeftWidth={0}
          borderTopRightRadius={12}
          borderBottomRightRadius={12}
        />
      </HStack>
    </Box>
  );
};

export default BatteryBar;