import React, { useEffect } from 'react';
import AppNavigator from './Navigation/AppNavigator';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config/src/gluestack-ui.config';
import { createTables, insertInitialFridge } from './db/database';

const App = () => {
  useEffect(() => {
    const initDatabase = async () => {
      try {
        await createTables();
        console.log('Database tables created successfully');
        await insertInitialFridge();
      } catch (error) {
        console.error('Error creating tables:', error);
      }
    };

    initDatabase();
  }, []);

  return (
    <GluestackUIProvider config={config}>
      <AppNavigator />
    </GluestackUIProvider>
  );
};

export default App;
