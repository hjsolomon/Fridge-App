import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';

/**
 * PowerSourceIcon
 * ----------------
 * Displays an icon and label representing a power source.
 *
 * - Circular icon container with customizable background color
 * - Dims and greys out when inactive
 */

interface SourceIconProps {
  icon: React.ReactNode;
  label: string;
  bgColor: string;
  active?: boolean;
}

const PowerSourceIcon: React.FC<SourceIconProps> = ({
  icon,
  label,
  bgColor,
  active = true,
}) => {
  return (
    <Box alignItems="center" mx="$0.5">
      {/* Icon container */}
      <Box
        w={110}
        h={80}
        borderRadius="$full"
        bg={active ? bgColor : '#8c8c8cff'}
        alignItems="center"
        justifyContent="center"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 20,
        }}
      >
        {icon}
      </Box>

      {/* Icon label */}
      <Text size="xl" color={active ? 'white' : '#cacacaff'} mt="$2">
        {label}
      </Text>
    </Box>
  );
};

export default PowerSourceIcon;
