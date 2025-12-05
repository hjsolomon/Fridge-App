import React from 'react';
import { Box, Text, HStack } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

/**
 * BatteryBar
 * -----------
 * Displays a stylized battery level indicator with a gradient fill.
 *
 * - Green gradient when > 50%
 * - Yellow gradient between 20–50%
 * - Red gradient when < 20%
 */

const BatteryBar: React.FC<{ level: number }> = ({ level }) => {
  const { width } = Dimensions.get('window');

  const barWidth = width * 0.85;
  const barHeight = width * 0.2;
  const tipWidth = barWidth * 0.04;
  const tipHeight = barHeight * 0.6;

  // Define gradient color sets
  const getGradientColors = () => {
    if (level > 50) return ['#6ebb6aff', '#3ca14a']; 
    if (level > 20) return ['#E2C044', '#d99d36ff']; 
    return ['#FF4D4D', '#b22f21ff']; 
  };

  // Keep a minimum fill visible
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
                width: (barWidth - 8) * (adjustedLevel / 100),
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                
              }}
            >
              <Text
                color="$white"
                fontSize={barHeight * 0.6}
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
