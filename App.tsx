import React, { useEffect, useState } from 'react';
import AppNavigator from './Navigation/AppNavigator';
import { GluestackUIProvider, Box, Text } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config/src/gluestack-ui.config';
import { resetDatabase, createTables, insertInitialFridge } from './db/database';

const App = () => {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
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
        <AppNavigator />
      )}
    </GluestackUIProvider>
  );
};

export default App;