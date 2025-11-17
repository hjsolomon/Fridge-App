import React from 'react';
import { View, Button, ButtonIcon } from '@gluestack-ui/themed';
import {
  Home,
  Bluetooth,
  ChartSpline,
  Syringe,
  Settings,
} from 'lucide-react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MotiView } from 'moti';
import { Dimensions } from 'react-native';

/**
 * BottomNav
 * ----------
 * Custom bottom navigation bar for React Navigation.
 * - Uses Gluestack UI for styling
 * - Responsive: Scales properly across screen sizes/aspect ratios
 * - Animated: Icons scale and fade when active
 * - Centered: Limited max width for tablet/large screens
 */
export default function BottomNav({ state, navigation }: BottomTabBarProps) {
  // Map route names to their respective Lucide icons
  const icons: Record<string, any> = {
    Bluetooth,
    Settings,
    Home,
    Dashboard: ChartSpline,
    Inventory: Syringe,
  };

  // Get current screen width to make sizing responsive
  const { width } = Dimensions.get('window');

  // Define relative scaling (adjusts automatically with screen size)
  const buttonSize = width * 0.17; // Each nav button = 14% of screen width
  const iconSize = width * 0.2;   // Icon = 7% of screen width
  const maxWidth = 500;            // Prevents the bar from stretching too wide on tablets

  return (
    // Wrapper centers the navigation bar horizontally
    <View
      alignItems="center"
      position="absolute"
      bottom="$6"
      left={0}
      right={0}
    >
      {/* Main navigation container */}
      <View
        flexDirection="row"
        justifyContent="space-around"
        alignItems="center"
        bg="#282828ff"
        px="$3"
        py="$2"
        mx="$2"
        mb="$1"
        borderTopWidth={1}
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
        {/* Loop through all navigation routes */}
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
              style={
                isFocused
                  ? {
                      // Extra shadow for the active (focused) button
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 10,
                      zIndex: 1,
                    }
                  : undefined
              }
              // Green background for active tab
              bg={isFocused ? '#3a783eff' : 'transparent'}
              // Navigate when a different tab is pressed
              onPress={() => {
                if (!isFocused) {
                  navigation.navigate(route.name);
                }
              }}
            >
              {/* MotiView adds a smooth scale/opacity animation */}
              <MotiView
                from={{ scale: 1, opacity: 0.6 }}
                animate={{
                  scale: isFocused ? 1.2 : 1,
                  opacity: isFocused ? 1 : 0.6,
                }}
                transition={{ type: 'timing', duration: 250 }}
              >
                {/* Icon component with responsive sizing */}
                <ButtonIcon
                  as={Icon}
                  size="2xl" // Required Gluestack token (for typing)
                  style={{ width: iconSize, height: iconSize }} // Actual responsive scaling
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
