import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface SourceIconProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const PowerSourceIcon: React.FC<SourceIconProps> = ({
  icon,
  label,
  active = true,
}) => {
  const { width, height } = Dimensions.get('window');

  const containerWidth = Math.min(Math.max(width * 0.26, 64), 120);
  const containerHeight = Math.min(Math.max(height * 0.10, 56), 100);
  const borderRadius = Math.round(Math.min(containerWidth, containerHeight) / 2);
  const iconSize = Math.round(Math.min(containerWidth, containerHeight) * 0.5);
  const labelFontSize = Math.max(12, Math.round(containerHeight * 0.25));

  // Make icon lighter/darker depending on active state
  let renderedIcon = icon;
  if (React.isValidElement(icon)) {
    renderedIcon = React.cloneElement(icon, {
      size: iconSize,
      color: active ? '#FFFFFF' : '#cacacaff',
    } as any);
  }

  // Define gradient colors based on the base color
  const gradientColors = active
    ? ['#6ebb6aff', '#3ca14a'] // subtle fade
    : ['#8c8c8cff', '#6c6c6cff']; // dim grey when inactive

  return (
    <Box alignItems="center" mx="$0.5">
      {/* Gradient container */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: containerWidth,
          height: containerHeight,
          borderRadius,
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
      </LinearGradient>

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
