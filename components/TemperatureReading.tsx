// src/components/TemperatureCircle.tsx
import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';

type TemperatureCircleProps = {
  temperature: number;
};

export const TemperatureCircle = ({ temperature }: TemperatureCircleProps) => {
  const getBorderColor = () => {
    if (temperature < 2 || temperature > 8) return '#D34949';
    return '#5DB565';
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
      <Text fontSize={'$8xl'} fontWeight="$normal" color="white">
        {temperature}°C
      </Text>
    </Box>
  );
};
