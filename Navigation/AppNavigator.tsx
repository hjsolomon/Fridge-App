import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import BluetoothScreen from '../Screens/BluetoothScreen';
import DashboardScreen from '../Screens/DashboardScreen';
import InventoryScreen from '../Screens/InventoryScreen';
import SettingsScreen from '@/Screens/SettingsScreen';
import HomeScreen from '../Screens/HomeScreen';
import BottomNav from '../components/BottomNavigation';
import Toast from 'react-native-toast-message';

/**
 * RootTabParamList
 * -----------------
 * Defines the type-safe parameters for the bottom tab navigator.
 * Each tab currently does not expect route parameters.
 */
export type RootTabParamList = {
  Bluetooth: undefined;
  Dashboard: undefined;
  Home: undefined;
  Inventory: undefined;
  Settings: undefined;
};

/* -------------------------------------------------------------------------- */
/*                            Navigation Theme Setup                           */
/* -------------------------------------------------------------------------- */

/**
 * navTheme
 * ---------
 * Customizes the default React Navigation theme to match the app's dark mode.
 * - Background color set to dark gray
 * - Text color set to white
 */
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#1C1C1C',
    text: '#FFFFFF',
  },
};

/* -------------------------------------------------------------------------- */
/*                          Bottom Tab Navigator Setup                         */
/* -------------------------------------------------------------------------- */

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * AppNavigator
 * -------------
 * Main navigation component for the app.
 *
 * - Uses a bottom tab navigator for primary screens
 * - Custom BottomNav component used for the tab bar
 * - Toast component included at root level for global notifications
 */
const AppNavigator = () => {
  return (
    <>
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator
          initialRouteName="Bluetooth" // Default starting screen
          screenOptions={{
            headerShown: false,   // Hide top headers for all screens
            animation: 'shift',   // Tab transition animation
          }}
          tabBar={(props) => <BottomNav {...props} />} // Custom tab bar
        >
          {/* Define each tab with its corresponding screen */}
          <Tab.Screen name="Bluetooth" component={BluetoothScreen} />
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Inventory" component={InventoryScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>

      {/* Global toast notifications */}
      <Toast />
    </>
  );
};

export default AppNavigator;
