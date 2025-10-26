import React from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { ScreenHeader } from '../components/ScreenHeader';


const SettingsScreen: React.FC = () => {
  return (
    <Box flex={1} bg="#1C1C1C" p="$4">
        <ScreenHeader title="Settings" 
        infoText="The Settings screen will be implemented in future updates, allowing you to customize app preferences, notification settings, and other configurations related to the refrigerator system."
/>
    </Box>
  );
};

export default SettingsScreen;
