/**
 * App.tsx
 * --------
 * Root entry point for the FridgeApp application.
 *
 * Responsibilities:
 * - Initializes the SQLite database (creates tables and seeds initial fridge record).
 * - Registers the device for push notifications via usePushNotifications.
 * - Wraps the app in GluestackUIProvider (theming) and BluetoothProvider (BLE context).
 * - Shows a loading screen while the database is initializing.
 * - Renders AppNavigator once the database is ready.
 */

import React, { useEffect, useState } from 'react';
import AppNavigator from './Navigation/AppNavigator';
import { GluestackUIProvider, Box, Text } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config/src/gluestack-ui.config';
import { createTables, insertInitialFridge } from './db/database';
// import { startSensorSimulator } from './utils/SensorSimulator';
import { BluetoothProvider } from './components/bluetooth/BluetoothContext';
import { usePushNotifications } from './utils/usePushNotifications';

/**
 * App
 * ----
 * Top-level React component. Handles database initialization on mount and
 * gates rendering behind a `dbReady` flag to prevent accessing tables before
 * they exist.
 */
const App = () => {
  const [dbReady, setDbReady] = useState(false);
  usePushNotifications();
  useEffect(() => {
    // startSensorSimulator();
    const initDatabase = async () => {
      try {
        await createTables();
        console.log('Database tables created successfully');
        await insertInitialFridge();
        setDbReady(true);
      } catch (error) {
        console.error('Error creating tables:', error);
      }
    };

    initDatabase();
  }, []);

  return (
    <GluestackUIProvider config={config}>
      {!dbReady ? (
        <Box flex={1} bg="#1C1C1C" justifyContent="center" alignItems="center">
          <Text color="white">Initializing database…</Text>
        </Box>
      ) : (
        <BluetoothProvider>
          <AppNavigator />
        </BluetoothProvider>
      )}
    </GluestackUIProvider>
  );
};

export default App;