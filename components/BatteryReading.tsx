import React from 'react';
import { Box, Text, HStack } from '@gluestack-ui/themed';



const BatteryBar: React.FC<{ level: number }> = ({ level }) => {
      const getColor = () => {
    if (level > 50) return "#6ebb6aff";
    if (level > 20) return "#E2C044";
    return "#FF4D4D";
  };

  return (
    <Box alignItems="center" justifyContent="center" bg="$#1C1C1C" mt="$3" >
      <HStack alignItems="center">
      <HStack
        w="$80"
        h="$24"
        borderWidth="$2"
        borderColor="#9a9a9aff"
        rounded="$3xl"
        overflow="hidden"
        alignItems="center"
        bg = "#1C1C1C"
              style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 5,
      }}
      >
        <Box
            mx = "$2"
            rounded="$2xl"
        h="$20"
            w={level <= 46 ? undefined : `${level - 4}%`}
            px="$3"
          bg={getColor()}
          alignItems="center"
          justifyContent="center"
        >
          <Text color="$white" fontSize="$6xl" fontWeight="$light">
            {level}%
          </Text>
        </Box>
        
      </HStack>

        <Box
          w="$3"
          h="$12"
          bg="#1C1C1C"
          borderColor="#9a9a9aff"
          borderWidth="$2"
        borderLeftWidth={0}   
        borderTopRightRadius={12}
        borderBottomRightRadius={12}     />
      </HStack>
    </Box>

  );
};

export default BatteryBar;
