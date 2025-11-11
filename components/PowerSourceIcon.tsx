import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';

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
    const { width, height } = Dimensions.get('window');

  const containerWidth = Math.min(Math.max(width * 0.26, 64), 120);
  const containerHeight = Math.min(Math.max(height * 0.10, 56), 100);
  const borderRadius = Math.round(Math.min(containerWidth, containerHeight) / 2);
  const iconSize = Math.round(Math.min(containerWidth, containerHeight) * 0.5);
  const labelFontSize = Math.max(12, Math.round(containerHeight * 0.25));
  
  let renderedIcon = icon;
  if (React.isValidElement(icon)) {
    renderedIcon = React.cloneElement(icon, {
      size: iconSize,
      color: active ? '#FFFFFF' : '#cacacaff',
    } as any);
  }
    return (
    <Box alignItems="center" mx="$0.5">
      {/* Icon container */}
      <Box
        style={{
          width: containerWidth,
          height: containerHeight,
          borderRadius,
          backgroundColor: active ? bgColor : '#8c8c8cff',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 6,
        }}
      >
        {renderedIcon}
      </Box>

      {/* Icon label */}
      <Text
        style={{ marginTop: 3, fontSize: labelFontSize }}
        color={active ? 'white' : '#cacacaff'}
      >
        {label}
      </Text>
    </Box>
  );
};

export default PowerSourceIcon;