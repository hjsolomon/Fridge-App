import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';

export const ScreenHeader: React.FC<{ title: string }> = ({ title }) => {
    return (
          <Box width="100%" alignItems="flex-start" my="$8">
            <Text fontWeight="bold" color="white" fontSize="$3xl" textAlign="left">
              {title}
            </Text>
            <Box mt="$4" height={1} width="100%" bg="#FFFFFF" opacity={0.3} />
          </Box>    
    );
};
