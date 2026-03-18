/**
 * BottomNavigation
 * ================
 * Custom bottom tab bar navigation component with animated icon feedback.
 *
 * Features:
 * - Pill-shaped tab bar with rounded corners
 * - Icon-based navigation with 5 main screens
 * - Animated scale + opacity on tab selection
 * - Responsive sizing based on screen width
 * - Safe area inset handling for notched devices
 * - Smooth 250ms transitions between states
 */

import React from 'react';
import { View, Button, ButtonIcon, Text } from '@gluestack-ui/themed';
import {
  Home,
  Bluetooth,
  ChartSpline,
  Syringe,
  Settings,
} from 'lucide-react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';

/* -------------------------------------------------------------------------- */
/*                               Constants                                    */
/* -------------------------------------------------------------------------- */

const { width } = Dimensions.get('window');

/**
 * TAB_BAR_HEIGHT
 * ---------------
 * Calculated total height of the bottom navigation bar.
 * Used by screen content to add bottom padding/margin.
 */
export const TAB_BAR_HEIGHT =
  width * 0.17 +  // Button size
  16 +            // Padding
  12;             // Additional margin

/* -------------------------------------------------------------------------- */
/*                        Component Definition                                */
/* -------------------------------------------------------------------------- */

/**
 * BottomNav
 * ----------
 * Renders the animated bottom tab navigation bar.
 *
 * Props (from BottomTabBarProps):
 * - state: Current navigation state with active route index
 * - navigation: Navigation prop for route changes
 *
 * Behavior:
 * - Maps state.routes to icon buttons
 * - Animated feedback on focused tab (scale + opacity)
 * - Safe area inset handling for Apple notch/Android system bars
 */
export default function BottomNav({ state, navigation }: BottomTabBarProps) {
  /* -------------------------------------------------------------------- */
  /*                         Safe Area & Sizing                            */
  /* -------------------------------------------------------------------- */

  const insets = useSafeAreaInsets();

  // Responsive sizing based on screen width
  const buttonSize = width * 0.17;  // Button container dimensions
  const iconSize = width * 0.2;     // Icon dimensions within button
  const maxWidth = 500;             // Max width constraint for large screens

  /* -------------------------------------------------------------------- */
  /*                       Icon Mapping                                    */
  /* -------------------------------------------------------------------- */

  /**
   * Icon mapping for all navigation screens.
   * Keys match navigation route names.
   */
  const icons: Record<string, any> = {
    Bluetooth,                    // Bluetooth connection screen
    Settings,                     // Settings/configuration screen
    Home,                         // Home dashboard
    Dashboard: ChartSpline,       // Analytics/insights
    Inventory: Syringe,          // Inventory management
  };

  return (
    <View
      alignItems="center"
      position="absolute"
      left={0}
      right={0}
      style={{ bottom: insets.bottom + 12 }}
    >
      {/* Tab bar container with rounded pill shape */}
      <View
        flexDirection="row"
        justifyContent="space-around"
        alignItems="center"
        bg="#282828ff"
        px="$3"
        py="$2"
        mx="$2"
        mb="$1"
        borderRadius="$full"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
          width: '95%',
          maxWidth,
        }}
      >
        {/* Render navigation buttons for each route */}
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const Icon = icons[route.name];

          return (
            <Button
              key={route.key}
              w={buttonSize}
              h={buttonSize}
              borderRadius="$full"
              justifyContent="center"
              alignItems="center"
              bg={'transparent'}
              onPress={() => {
                // Only navigate if not already on this tab
                if (!isFocused) navigation.navigate(route.name);
              }}
            >
              {/* Animated icon with scale and opacity transitions */}
              <MotiView
                animate={{
                  scale: isFocused ? 1.2 : 1,      // Grow when focused
                  opacity: isFocused ? 1 : 0.6,    // Brighten when focused
                }}
                transition={{ type: 'timing', duration: 250 }}
              >
                <ButtonIcon
                  as={Icon}
                  size="2xl"
                  style={{ width: iconSize, height: iconSize }}
                  color={isFocused ? '#FFFFFF' : '#cdcdcdff'}
                />
              </MotiView>
            </Button>
          );
        })}
      </View>
    </View>
  );
}
