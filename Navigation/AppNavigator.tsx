import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


import BluetoothScreen from '../Screens/BluetoothScreen';
import DashboardScreen from '../Screens/DashboardScreen';
import HomeScreen from '../Screens/HomeScreen';

export type RootStackParamList = {
  Bluetooth: undefined;
  Dashboard: undefined;
  Home: undefined
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Bluetooth">
        <Stack.Screen
          name="Bluetooth"
          component={BluetoothScreen}
          options={{ title: 'Connect Fridge' }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Fridge Dashboard' }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Home Screen' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
