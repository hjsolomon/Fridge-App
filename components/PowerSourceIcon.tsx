import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';

interface SourceIconProps {
  icon: React.ReactNode;
  label: string;
  bgColor: string;
  active?: boolean;
}

const PowerSourceIcon: React.FC<SourceIconProps> = ({ icon, label, bgColor, active = true }) => {
  return (
    <Box alignItems="center" mx="$0.5">
      <Box
        w={110}
        h={80}
        borderRadius="$full"
        bg={active ? bgColor : "#8c8c8cff"}
        alignItems="center"
        justifyContent="center"
              style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      }}
      >
        {icon}
      </Box>
      <Text size="xl" color={active ? "white" : "#cacacaff"} mt="$2">
        {label}
      </Text>
    </Box>
  );
};

export default PowerSourceIcon;
