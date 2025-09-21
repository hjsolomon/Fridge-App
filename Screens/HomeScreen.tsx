import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { TemperatureCircle } from '../components/TemperatureReading';

const HomeScreen: React.FC = () => {
  return (
    <Box flex={1} bg="#1C1C1C" p="$4">
      <Box width="100%" alignItems="flex-start" my="$8">
        <Text fontWeight="bold" color="white" fontSize="$3xl" textAlign="left">
          Home
        </Text>
        <Box mt="$2" height={1} width="100%" bg="#FFFFFF" opacity={0.3} />
      </Box>

      <Box flex={1} alignItems="center" my="$3">
        <TemperatureCircle temperature={5} />
      </Box>
    </Box>
  );
};

export default HomeScreen;
