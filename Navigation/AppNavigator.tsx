/**
 * AppNavigator
 * =============
 * Root navigation container using React Navigation bottom tab navigator.
 * Provides the main app structure with tab-based screen switching.
 *
 * Features:
 * - Bottom tab navigation with 5 screens
 * - Custom animated tab bar (BottomNav component)
 * - Dark gradient background throughout
 * - Toast notification system integration
 * - Responsive navigation theme
 */

import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';

import BluetoothScreen from '../Screens/BluetoothScreen';
import DashboardScreen from '../Screens/DashboardScreen';
import InventoryScreen from '../Screens/InventoryScreen';
import SettingsScreen from '@/Screens/SettingsScreen';
import HomeScreen from '../Screens/HomeScreen';
import BottomNav from '../components/BottomNavigation';

/* -------------------------------------------------------------------------- */
/*                             Type Definitions                               */
/* -------------------------------------------------------------------------- */

/**
 * RootTabParamList
 * ----------------
 * Type-safe navigation route names and parameters.
 * Each route maps to a screen with undefined parameters.
 */
export type RootTabParamList = {
  Bluetooth: undefined;  // BLE device scanning and connection
  Dashboard: undefined;  // Temperature insights and analytics
  Home: undefined;       // Current status overview
  Inventory: undefined;  // Vial inventory management
  Settings: undefined;   // Notification preferences
};

/* -------------------------------------------------------------------------- */
/*                         Navigation Configuration                           */
/* -------------------------------------------------------------------------- */

/**
 * Navigation theme configuration.
 * Overrides default theme with app-specific colors and styling.
 */
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',  // Allow gradient background to show
    text: '#FFFFFF',            // White text throughout app
  },
};

const Tab = createBottomTabNavigator<RootTabParamList>();

/* -------------------------------------------------------------------------- */
/*                         Component Definition                                */
/* -------------------------------------------------------------------------- */

/**
 * AppNavigator
 * ============
 * Main navigation structure.
 * Renders bottom tabs, background gradient, and notification toasts.
 */
const AppNavigator = () => {
  return (
    <View style={{ flex: 1 }}>
      {/* Dark Gradient Background (entire app) */}
      <LinearGradient
        colors={['#1a1a1aff', '#141414ff']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Navigation Container with Theme */}
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator
          initialRouteName="Bluetooth"
          screenOptions={{
            headerShown: false,    // Hide standard header
            animation: 'shift',    // Smooth screen transition
          }}
          tabBar={(props) => <BottomNav {...props} />}  // Custom animated tab bar
        >
          {/* Screen Definitions */}
          <Tab.Screen name="Bluetooth" component={BluetoothScreen} />
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Inventory" component={InventoryScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>

      {/* Toast Notification System */}
      <Toast />
    </View>
  );
};

export default AppNavigator;
