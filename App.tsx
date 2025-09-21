import React from 'react';
import AppNavigator from './Navigation/AppNavigator';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config/src/gluestack-ui.config.ts';


const App = () => {
  return(<GluestackUIProvider config={config}>
  <AppNavigator />
</GluestackUIProvider>
);
};

export default App;
