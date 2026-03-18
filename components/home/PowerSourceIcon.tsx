/**
 * PowerSourceIcon
 * ================
 * Displays a visual indicator for the fridge's power source (battery, grid, etc.).
 *
 * Features:
 * - Responsive container sizing based on screen dimensions
 * - Icon color changes based on active/inactive state
 * - Dynamic gradient background:
 *   - Green gradient when active (power available)
 *   - Gray gradient when inactive (no power)
 * - Icon with label below for clear labeling
 * - Shadow effects for visual depth
 */

import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

/* -------------------------------------------------------------------------- */
/*                             Type Definitions                               */
/* -------------------------------------------------------------------------- */

interface SourceIconProps {
  icon: React.ReactNode;              // Icon component to display
  label: string;                      // Text label below icon
  active?: boolean;                   // Whether source is currently active
}

/* -------------------------------------------------------------------------- */
/*                             Component Definition                            */
/* -------------------------------------------------------------------------- */

const PowerSourceIcon: React.FC<SourceIconProps> = ({
  icon,
  label,
  active = true,
}) => {
  const { width, height } = Dimensions.get('window');

  /* -------------------------------------------------------------------- */
  /*                          Responsive Sizing                            */
  /* -------------------------------------------------------------------- */

  // All dimensions scale fluidly with device screen size
  const containerWidth = Math.min(width * 0.27, 120);      // Max width: 120px
  const containerHeight = Math.min(height * 0.075, 100);   // Max height: 100px
  const borderRadius = Math.round(Math.min(containerWidth, containerHeight) / 2);
  const iconSize = Math.round(containerHeight * 0.6);      // Icon is 60% of container height
  const labelFontSize = Math.max(12, Math.round(containerHeight * 0.28));  // Min 12px

  /* -------------------------------------------------------------------- */
  /*                        Icon & Color Styling                           */
  /* -------------------------------------------------------------------- */

  /**
   * Clone icon and apply color/size based on active state.
   * Active: White icon for clarity
   * Inactive: Gray icon to show disabled state
   */
  let renderedIcon = icon;
  if (React.isValidElement(icon)) {
    renderedIcon = React.cloneElement(icon, {
      size: iconSize,
      color: active ? '#FFFFFF' : '#cacacaff',
    } as any);
  }

  /**
   * getGradientColors()
   * -------------------
   * Returns gradient colors based on power source active state.
   * Active: Green gradient for operational status
   * Inactive: Gray gradient for disabled/unavailable status
   */
  const gradientColors = active
    ? ['#6ebb6aff', '#3ca14a']      // Green: Active/available
    : ['#8c8c8cff', '#6c6c6cff'];   // Gray: Inactive/unavailable

  return (
    <Box alignItems="center" mx="$0.5">
      {/* Gradient container with icon */}
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

      {/* Label text below icon */}
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
