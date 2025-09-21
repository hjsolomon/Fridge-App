import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import BluetoothScreen from '../Screens/BluetoothScreen';
import DashboardScreen from '../Screens/DashboardScreen';
import HomeScreen from '../Screens/HomeScreen';
import BottomNav from '../components/BottomNavigation';

export type RootTabParamList = {
  Bluetooth: undefined;
  Dashboard: undefined;
  Home: undefined;
};

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#1C1C1C',
    text: '#FFFFFF',
  },
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        initialRouteName="Bluetooth"
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <BottomNav {...props} />}
      >
        <Tab.Screen name="Bluetooth" component={BluetoothScreen} />
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
