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

export type RootTabParamList = {
  Bluetooth: undefined;
  Dashboard: undefined;
  Home: undefined;
  Inventory: undefined;
  Settings: undefined;
};

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
    text: '#FFFFFF',
  },
  
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const AppNavigator = () => {
  return (
    <View style={{ flex: 1 }}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1a1a1aff', '#141414ff']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Navigation Container */}
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator
          initialRouteName="Bluetooth"
          screenOptions={{
            headerShown: false,
            animation: 'shift',
          }}
          tabBar={(props) => <BottomNav {...props} />}
        >
          <Tab.Screen name="Bluetooth" component={BluetoothScreen} />
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Inventory" component={InventoryScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>

      {/* Toast Notifications */}
      <Toast />
    </View>
  );
};

export default AppNavigator;
