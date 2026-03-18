/**
 * BatteryBar
 * ===========
 * Displays a stylized battery level indicator with a responsive gradient fill.
 *
 * Features:
 * - Responsive sizing based on screen width
 * - Dynamic gradient colors based on charge level:
 *   - Green (>50%): Optimal charge
 *   - Yellow (20-50%): Low battery warning
 *   - Red (<20%): Critical battery alert
 * - Minimum visible fill for visual clarity
 * - Shadow/elevation effects for depth
 * - Battery tip (connector) visual element
 */

import React from 'react';
import { Box, Text, HStack } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

/* -------------------------------------------------------------------------- */
/*                             Component Definition                            */
/* -------------------------------------------------------------------------- */

interface BatteryBarProps {
  level: number; // Battery percentage (0-100)
}

const BatteryBar: React.FC<{ level: number }> = ({ level }) => {
  const { width } = Dimensions.get('window');

  /* -------------------------------------------------------------------- */
  /*                          Responsive Sizing                            */
  /* -------------------------------------------------------------------- */

  // Calculate dimensions based on screen width for responsive layout
  const barWidth = width * 0.85;        // Main battery bar width
  const barHeight = width * 0.2;        // Battery bar height
  const tipWidth = barWidth * 0.04;     // Battery connector width
  const tipHeight = barHeight * 0.6;    // Battery connector height

  /* -------------------------------------------------------------------- */
  /*                        Color & Level Logic                            */
  /* -------------------------------------------------------------------- */

  /**
   * getGradientColors()
   * -------------------
   * Returns gradient color pair based on current battery level.
   * Color indicates urgency and charge status.
   */
  const getGradientColors = () => {
    if (level > 50) return ['#65b760ff', '#3ca14a'];      // Green: Good
    if (level > 20) return ['#E2C044', '#d99d36ff'];      // Yellow: Warning
    return ['#d43737ff', '#b22f21ff'];                     // Red: Critical
  };

  // Maintain minimum visible fill width (40%) for clarity at low levels
  const minFillPercent = 40;
  const adjustedLevel = Math.max(level, minFillPercent);

  return (
    <Box alignItems="center" justifyContent="center" bg="transparent" mt="$3">
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
          {/* Battery fill with gradient */}
          <Box mx="$2" rounded="$2xl" overflow="hidden">
            <LinearGradient
              colors={getGradientColors()}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                height: barHeight * 0.8,
                width: (barWidth - 30) * (adjustedLevel / 100),
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                
              }}
            >
              <Text
                color="$white"
                fontSize={barHeight * 0.55}
                fontWeight="$light"
              >
                {level}%
              </Text>
            </LinearGradient>
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
